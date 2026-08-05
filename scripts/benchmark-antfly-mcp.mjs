#!/usr/bin/env node

import { performance } from "node:perf_hooks";

const READ_ONLY_TOOLS = new Set([
  "describe_mcp_capabilities",
  "describe_query_request",
  "describe_table",
  "describe_indexes",
  "list_tables",
  "list_indexes",
  "query",
  "get_document",
  "sample_documents",
]);

const WRITE_TOOLS = new Set([
  "batch",
  "backup",
  "restore",
  "create_table",
  "create_index",
  "drop_table",
  "drop_index",
]);

const config = {
  url: process.env.ANTFLY_MCP_URL,
  token: process.env.ANTFLY_API_KEY,
  rounds: positiveInteger(process.env.ANTFLY_BENCHMARK_ROUNDS, 10),
  table: process.env.ANTFLY_TABLE || "antfly_docs",
  field: process.env.ANTFLY_FULL_TEXT_FIELD || "text",
  index: process.env.ANTFLY_VECTOR_INDEX || "document_vectors",
  question: process.env.ANTFLY_BENCHMARK_QUESTION || "What is Antfly and how does hybrid search work?",
  limit: positiveInteger(process.env.ANTFLY_BENCHMARK_LIMIT, 6),
  mode: process.env.ANTFLY_BENCHMARK_MODE || "hybrid",
};

if (!config.url || !config.token) {
  console.error("Set ANTFLY_MCP_URL and ANTFLY_API_KEY before running the benchmark.");
  process.exit(2);
}
if (!new Set(["bm25", "semantic", "hybrid"]).has(config.mode)) {
  console.error("ANTFLY_BENCHMARK_MODE must be bm25, semantic, or hybrid.");
  process.exit(2);
}

const variants = parseVariants(process.env.ANTFLY_BENCHMARK_VARIANTS);

let requestId = 0;
let negotiatedProtocolVersion = "2025-06-18";

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseVariants(value) {
  const entries = value ? value.split(",") : [`${config.mode}:${config.limit}`];
  return entries.map((entry) => {
    const [mode, rawLimit] = entry.trim().split(":");
    const limit = positiveInteger(rawLimit, config.limit);
    if (!new Set(["bm25", "semantic", "hybrid"]).has(mode)) {
      throw new Error(`Invalid benchmark variant mode: ${mode}`);
    }
    return { key: `${mode}-${limit}`, mode, limit };
  });
}

function parseResponse(text, contentType) {
  if (!text.trim()) return null;
  if (contentType.includes("application/json")) return JSON.parse(text);

  const messages = text
    .split(/\r?\n\r?\n/)
    .flatMap((event) => event.split(/\r?\n/))
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((line) => line && line !== "[DONE]")
    .map((line) => JSON.parse(line));

  return messages.at(-1) ?? null;
}

async function rpc(method, params, sessionId, expectResponse = true) {
  const body = {
    jsonrpc: "2.0",
    method,
    ...(expectResponse ? { id: ++requestId } : {}),
    ...(params === undefined ? {} : { params }),
  };
  const started = performance.now();
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      ...(sessionId ? {
        "Mcp-Session-Id": sessionId,
        "Mcp-Protocol-Version": negotiatedProtocolVersion,
      } : {}),
    },
    body: JSON.stringify(body),
  });
  const ttfbMs = performance.now() - started;
  const text = await response.text();
  const elapsedMs = performance.now() - started;

  if (!response.ok) {
    throw new Error(`${method} returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  const payload = parseResponse(text, response.headers.get("content-type") ?? "");
  if (payload?.error) {
    throw new Error(`${method} returned MCP error ${payload.error.code}: ${payload.error.message}`);
  }

  return {
    elapsedMs,
    ttfbMs,
    bodyMs: elapsedMs - ttfbMs,
    bytes: Buffer.byteLength(text),
    payload,
    sessionId: response.headers.get("mcp-session-id") || sessionId,
  };
}

async function initialize() {
  const initialized = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "antfly-mcp-latency-benchmark", version: "0.1.0" },
  });
  if (!initialized.sessionId) throw new Error("Initialize response did not include Mcp-Session-Id");
  negotiatedProtocolVersion =
    initialized.payload?.result?.protocolVersion || negotiatedProtocolVersion;
  await rpc("notifications/initialized", {}, initialized.sessionId, false);
  return initialized;
}

async function callTool(sessionId, name, args = {}) {
  if (!READ_ONLY_TOOLS.has(name)) throw new Error(`Refusing non-read-only tool call: ${name}`);
  const result = await rpc("tools/call", { name, arguments: args }, sessionId);
  if (result.payload?.result?.isError === true) {
    const message = (result.payload.result.content ?? [])
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join(" ")
      .slice(0, 500);
    throw new Error(`${name} returned an MCP tool error${message ? `: ${message}` : ""}`);
  }
  return result;
}

function summarize(samples) {
  const percentile = (values, fraction) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
  };
  const elapsed = samples.map((sample) => sample.elapsedMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);
  const body = samples.map((sample) => sample.bodyMs);
  return {
    runs: samples.length,
    p50Ms: round(percentile(elapsed, 0.5)),
    p95Ms: round(percentile(elapsed, 0.95)),
    minMs: round(Math.min(...elapsed)),
    maxMs: round(Math.max(...elapsed)),
    ttfbP50Ms: round(percentile(ttfb, 0.5)),
    bodyP50Ms: round(percentile(body, 0.5)),
    meanBytes: Math.round(samples.reduce((sum, sample) => sum + sample.bytes, 0) / samples.length),
  };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

async function measure(sessionId, name, args) {
  const samples = [];
  for (let iteration = 0; iteration < config.rounds; iteration += 1) {
    samples.push(await callTool(sessionId, name, args));
  }
  return summarize(samples);
}

function queryRequest(mode, limit) {
  const request = {
    hierarchy: { return_level: "chunk", include: ["source", "unit"] },
    limit,
  };
  if (mode !== "semantic") {
    request.full_text_search = { match: config.question, field: config.field };
  }
  if (mode !== "bm25") {
    request.semantic_search = config.question;
    request.indexes = [config.index];
  }
  if (mode === "hybrid") request.merge_config = { strategy: "rrf" };
  return request;
}

async function measureRetrievalVariants(sessionId) {
  const samples = Object.fromEntries(variants.map(({ key }) => [key, []]));
  for (let iteration = 0; iteration < config.rounds; iteration += 1) {
    for (const variant of variants) {
      samples[variant.key].push(await callTool(sessionId, "query", {
        tableName: config.table,
        queryRequest: queryRequest(variant.mode, variant.limit),
      }));
    }
  }
  return Object.fromEntries(Object.entries(samples).map(([key, values]) => [key, summarize(values)]));
}

const cold = await initialize();
const listed = await rpc("tools/list", {}, cold.sessionId);
const toolNames = (listed.payload?.result?.tools ?? []).map((tool) => tool.name).sort();
const unexpectedTools = toolNames.filter((name) => !READ_ONLY_TOOLS.has(name));
const exposedWriteTools = toolNames.filter((name) => WRITE_TOOLS.has(name));

const results = {
  generatedAt: new Date().toISOString(),
  endpoint: new URL(config.url).origin,
  rounds: config.rounds,
  query: { variants, table: config.table },
  coldStart: {
    initializeMs: round(cold.elapsedMs),
    initializeBytes: cold.bytes,
    toolsListMs: round(listed.elapsedMs),
    toolsListBytes: listed.bytes,
  },
  safety: {
    advertisedTools: toolNames,
    unexpectedTools,
    exposedWriteTools,
    passed: unexpectedTools.length === 0,
  },
  warm: {
    describeMcpCapabilities: await measure(cold.sessionId, "describe_mcp_capabilities", {}),
    describeQueryRequest: await measure(cold.sessionId, "describe_query_request", {}),
    listTables: await measure(cold.sessionId, "list_tables", {}),
    retrievals: await measureRetrievalVariants(cold.sessionId),
  },
};

console.log(JSON.stringify(results, null, 2));
if (!results.safety.passed) process.exitCode = 3;

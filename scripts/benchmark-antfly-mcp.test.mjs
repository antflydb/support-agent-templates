import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import test from "node:test";

const READ_ONLY_TOOLS = [
  "describe_mcp_capabilities",
  "describe_query_request",
  "describe_table",
  "describe_indexes",
  "list_tables",
  "list_indexes",
  "query",
  "get_document",
  "sample_documents",
];

test("benchmark initializes a session and calls only read-only tools", async (t) => {
  const calls = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    calls.push(message.method === "tools/call" ? message.params.name : message.method);

    if (message.method !== "initialize") {
      assert.equal(request.headers["mcp-session-id"], "test-session");
      assert.equal(request.headers["mcp-protocol-version"], "2025-06-18");
    }

    response.setHeader("Content-Type", "application/json");
    if (message.method === "initialize") {
      response.setHeader("Mcp-Session-Id", "test-session");
      response.end(JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "mock-antfly", version: "0.1.0" },
        },
      }));
      return;
    }
    if (message.method === "notifications/initialized") {
      response.statusCode = 202;
      response.end();
      return;
    }
    if (message.method === "tools/list") {
      response.end(JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        result: { tools: READ_ONLY_TOOLS.map((name) => ({ name, inputSchema: { type: "object" } })) },
      }));
      return;
    }
    response.end(JSON.stringify({
      jsonrpc: "2.0",
      id: message.id,
      result: { content: [{ type: "text", text: "ok" }], structuredContent: { hits: [] } },
    }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const address = server.address();
  assert.equal(typeof address, "object");

  const child = spawn(process.execPath, ["scripts/benchmark-antfly-mcp.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      ANTFLY_MCP_URL: `http://127.0.0.1:${address.port}/mcp/v1`,
      ANTFLY_API_KEY: "test-only-token",
      ANTFLY_BENCHMARK_ROUNDS: "2",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((resolve) => child.on("close", resolve));

  assert.equal(exitCode, 0, stderr);
  const result = JSON.parse(stdout);
  assert.equal(result.safety.passed, true);
  assert.equal(result.warm.retrievals["hybrid-6"].runs, 2);
  assert.deepEqual(calls, [
    "initialize",
    "notifications/initialized",
    "tools/list",
    "describe_mcp_capabilities",
    "describe_mcp_capabilities",
    "describe_query_request",
    "describe_query_request",
    "list_tables",
    "list_tables",
    "query",
    "query",
  ]);
});

test("benchmark rejects MCP tool-level errors", async (t) => {
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    response.setHeader("Content-Type", "application/json");

    if (message.method === "initialize") {
      response.setHeader("Mcp-Session-Id", "error-session");
      response.end(JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        result: { protocolVersion: "2025-06-18", capabilities: { tools: {} } },
      }));
      return;
    }
    if (message.method === "notifications/initialized") {
      response.statusCode = 202;
      response.end();
      return;
    }
    if (message.method === "tools/list") {
      response.end(JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        result: { tools: READ_ONLY_TOOLS.map((name) => ({ name, inputSchema: { type: "object" } })) },
      }));
      return;
    }
    response.end(JSON.stringify({
      jsonrpc: "2.0",
      id: message.id,
      result: { isError: true, content: [{ type: "text", text: "fixture failure" }] },
    }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const address = server.address();
  assert.equal(typeof address, "object");

  const child = spawn(process.execPath, ["scripts/benchmark-antfly-mcp.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      ANTFLY_MCP_URL: `http://127.0.0.1:${address.port}/mcp/v1`,
      ANTFLY_API_KEY: "test-only-token",
      ANTFLY_BENCHMARK_ROUNDS: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((resolve) => child.on("close", resolve));

  assert.notEqual(exitCode, 0);
  assert.match(stderr, /MCP tool error: fixture failure/);
});

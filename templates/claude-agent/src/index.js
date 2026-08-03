import { readFile } from "node:fs/promises";
import { query } from "@anthropic-ai/claude-agent-sdk";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const values = {
  PRODUCT_NAME: process.env.SUPPORT_PRODUCT_NAME || "Antfly",
  AGENT_NAME: process.env.SUPPORT_AGENT_NAME || "Antfly Docs Support",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@antfly.io",
  TABLE_NAME: process.env.ANTFLY_TABLE || "antfly_docs",
  VECTOR_INDEX: process.env.ANTFLY_VECTOR_INDEX || "document_vectors",
  FULL_TEXT_FIELD: process.env.ANTFLY_SEARCH_FIELD || "text",
  DOCS_BASE_URL: process.env.DOCS_BASE_URL || "https://antfly.io/docs",
};

const promptUrl = new URL("../../../shared/prompts/support-agent.md", import.meta.url);
const queryUrl = new URL("../../../shared/retrieval/query-request.json", import.meta.url);
let systemPrompt = await readFile(promptUrl, "utf8");
let queryTemplate = await readFile(queryUrl, "utf8");

for (const [name, value] of Object.entries(values)) {
  systemPrompt = systemPrompt.replaceAll(`{{${name}}}`, value);
  queryTemplate = queryTemplate.replaceAll(`{{${name}}}`, value);
}

systemPrompt += `\n\nCanonical query shape for this deployment:\n${queryTemplate}`;

const question = process.argv.slice(2).join(" ").trim();
if (!question) {
  console.error('Usage: npm start -- "What is Antfly?"');
  process.exit(1);
}

let finalResult;
for await (const message of query({
  prompt: question,
  options: {
    model: process.env.CLAUDE_MODEL || undefined,
    systemPrompt,
    maxTurns: 3,
    tools: [],
    strictMcpConfig: true,
    settingSources: [],
    mcpServers: {
      antfly: {
        type: "http",
        url: required("ANTFLY_MCP_URL"),
        headers: {
          Authorization: `Bearer ${required("ANTFLY_API_KEY")}`,
        },
      },
    },
    allowedTools: [
      "mcp__antfly__query",
      "mcp__antfly__get_document",
    ],
  },
})) {
  if (message.type === "system" && message.subtype === "init") {
    const unavailable = message.mcp_servers?.filter(
      (server) => server.status === "failed" || server.status === "needs-auth",
    );
    if (unavailable?.length) {
      console.error("Antfly MCP unavailable:", unavailable);
    }
  }
  if (message.type === "result") finalResult = message;
}

if (!finalResult || finalResult.subtype !== "success") {
  const detail = finalResult?.errors?.join("; ") || "No successful result";
  throw new Error(`Claude Agent failed: ${detail}`);
}

console.log(finalResult.result);

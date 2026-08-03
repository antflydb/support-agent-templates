import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const jsonFiles = [
  "package.json",
  "shared/retrieval/query-request.json",
  "shared/security/read-only-tools.json",
  "shared/evals/support-agent.json",
  "shared/evals/antfly-docs.json",
  "templates/claude-code/.mcp.json",
  "templates/claude-code/.claude/settings.json",
  "templates/claude-agent/package.json",
  "templates/pi/package.json",
  "templates/pi/tsconfig.json",
];

for (const file of jsonFiles) {
  JSON.parse(await readFile(file, "utf8"));
}

const prompt = await readFile("shared/prompts/support-agent.md", "utf8");
const queryTemplate = await readFile(
  "shared/retrieval/query-request.json",
  "utf8",
);
const portableContract = `${prompt}\n${queryTemplate}`;
const requiredPlaceholders = [
  "{{PRODUCT_NAME}}",
  "{{AGENT_NAME}}",
  "{{SUPPORT_EMAIL}}",
  "{{TABLE_NAME}}",
  "{{VECTOR_INDEX}}",
  "{{FULL_TEXT_FIELD}}",
  "{{DOCS_BASE_URL}}",
];

for (const placeholder of requiredPlaceholders) {
  if (!portableContract.includes(placeholder)) {
    throw new Error(`Missing prompt placeholder: ${placeholder}`);
  }
}

const query = JSON.parse(queryTemplate);
if (query.queryRequest?.merge_config?.strategy !== "rrf") {
  throw new Error("The shared query must use RRF fusion");
}
if (query.queryRequest?.hierarchy?.return_level !== "chunk") {
  throw new Error("The shared query must return chunks");
}
if (query.queryRequest?.limit > 6) {
  throw new Error("The shared query limit must remain at or below 6");
}

const policy = JSON.parse(
  await readFile("shared/security/read-only-tools.json", "utf8"),
);
for (const writeTool of [
  "create_table",
  "drop_table",
  "create_index",
  "drop_index",
  "batch",
  "backup",
  "restore",
]) {
  if (!policy.deny.includes(writeTool)) {
    throw new Error(`Read-only policy must deny ${writeTool}`);
  }
}

const harnesses = [
  "claude-code",
  "claude-agent",
  "hermes",
  "pi",
  "n8n",
  "copilot",
  "nextjs",
];

for (const harness of harnesses) {
  await access(`templates/${harness}/README.md`);
}

for (const file of [
  "templates/n8n/system-message.md",
  "templates/copilot/instructions.md",
  "templates/claude-code/CLAUDE.md",
  "templates/hermes/.hermes.md",
  "templates/pi/AGENTS.md",
]) {
  const instructions = await readFile(file, "utf8");
  for (const rule of ["retrieval", "chunk"]) {
    if (!instructions.toLowerCase().includes(rule.toLowerCase())) {
      throw new Error(`${file} is missing the ${rule} contract rule`);
    }
  }
  if (!/(write|never create|no Antfly write)/i.test(instructions)) {
    throw new Error(`${file} is missing a read-only safety rule`);
  }
}

for (const file of [
  "templates/claude-code/.env.example",
  "templates/claude-agent/.env.example",
  "templates/hermes/.env.example",
  "templates/pi/.env.example",
  "templates/n8n/.env.example",
  "templates/copilot/.env.example",
  "examples/antfly-docs/.env.example",
]) {
  const environment = await readFile(file, "utf8");
  if (!environment.includes("ANTFLY_MCP_URL=") || !environment.includes("ANTFLY_API_KEY=")) {
    throw new Error(`${file} must document the common Antfly connection variables`);
  }
  if (/ANTFLY_API_KEY=(?!replace-|your-|YOUR_|$)[^\s]{20,}/i.test(environment)) {
    throw new Error(`${file} appears to contain a real Antfly API key`);
  }
}

const n8nInstructions = await readFile("templates/n8n/system-message.md", "utf8");
const copilotInstructions = await readFile("templates/copilot/instructions.md", "utf8");
for (const [name, instructions] of [
  ["n8n", n8nInstructions],
  ["Copilot", copilotInstructions],
]) {
  if (!instructions.includes("tableName") || !instructions.includes("queryRequest")) {
    throw new Error(`${name} instructions must preserve raw QueryRequest argument placement`);
  }
  if (!instructions.includes("limit 6") && !instructions.includes('"limit": 6')) {
    throw new Error(`${name} instructions must enforce the six-hit limit`);
  }
}

const markdownFiles = (await readdir(".", { recursive: true }))
  .filter((file) => file.endsWith(".md"))
  .filter((file) => !file.includes("node_modules/"));

for (const file of markdownFiles) {
  const markdown = await readFile(file, "utf8");
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = decodeURIComponent(target.split("#", 1)[0]);
    await access(resolve(dirname(file), path));
  }
}

console.log("Shared contract and all Antfly harness adapters are valid.");

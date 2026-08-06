import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const jsonFiles = [
  "package.json",
  "shared/retrieval/query-request.json",
  "shared/retrieval/semantic-query-request.json",
  "shared/security/read-only-tools.json",
  "shared/evals/support-agent.json",
  "shared/evals/antfly-docs.json",
  "templates/claude-code/.claude/settings.json",
  "templates/claude-code/evals.json",
  "templates/claude-code/retrieval/query-request.json",
  "templates/claude-code/retrieval/semantic-query-request.json",
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
const semanticQueryTemplate = await readFile(
  "shared/retrieval/semantic-query-request.json",
  "utf8",
);
const portableContract = `${prompt}\n${queryTemplate}\n${semanticQueryTemplate}`;
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
const semanticQuery = JSON.parse(semanticQueryTemplate);
if (query.queryRequest?.merge_config?.strategy !== "rrf") {
  throw new Error("The shared query must use RRF fusion");
}
if (query.queryRequest?.hierarchy?.return_level !== "chunk") {
  throw new Error("The shared query must return chunks");
}
if (query.queryRequest?.limit > 6) {
  throw new Error("The shared query limit must remain at or below 6");
}
if (semanticQuery.queryRequest?.full_text_search || semanticQuery.queryRequest?.merge_config) {
  throw new Error("The broad-question query must remain semantic-first");
}
if (!semanticQuery.queryRequest?.semantic_search || !semanticQuery.queryRequest?.indexes?.length) {
  throw new Error("The broad-question query must configure semantic retrieval");
}
if (semanticQuery.queryRequest?.hierarchy?.return_level !== "chunk") {
  throw new Error("The broad-question query must return chunks");
}
if (semanticQuery.queryRequest?.limit > 6) {
  throw new Error("The broad-question query limit must remain at or below 6");
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

await access("templates/claude-code/setup-mcp.sh");

try {
  await access("templates/claude-code/.mcp.json");
  throw new Error(
    "Claude Code template must not track .mcp.json because HTTP credentials are persisted literally",
  );
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
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

const claudeCodeEvals = JSON.parse(
  await readFile("templates/claude-code/evals.json", "utf8"),
);
const claudeUseCaseEval = claudeCodeEvals.cases?.find(
  (testCase) => testCase.id === "antfly-overview-and-use-cases",
);
if (!claudeUseCaseEval) {
  throw new Error("Claude Code adapter must retain the Antfly overview/use-case regression eval");
}
for (const expectation of [
  "semantic_first",
  "direct_stored_chunk_evidence",
  "no_source_rollup",
  "no_field_projection",
  "no_shell_or_filesystem_fallback",
  "no_internal_retrieval_diagnostics",
  "friendly_public_citations",
]) {
  if (!claudeUseCaseEval.expect?.includes(expectation)) {
    throw new Error(`Claude Code overview eval is missing expectation: ${expectation}`);
  }
}

const claudeCodeInstructions = await readFile(
  "templates/claude-code/CLAUDE.md",
  "utf8",
);
for (const [name, rule] of [
  ["direct chunk return", /return_level[^\n]+chunk/],
  ["field projection ban", /Omit `fields`/],
  ["shell fallback ban", /Do not\s+run shell commands/],
  ["diagnostic suppression", /Do not\s+report tool\s+calls/],
]) {
  if (!rule.test(claudeCodeInstructions)) {
    throw new Error(`Claude Code adapter is missing compact retrieval rule: ${name}`);
  }
}

for (const file of [
  "templates/claude-code/retrieval/query-request.json",
  "templates/claude-code/retrieval/semantic-query-request.json",
]) {
  const request = JSON.parse(await readFile(file, "utf8"));
  const hierarchy = request.queryRequest?.hierarchy;
  if (JSON.stringify(hierarchy) !== JSON.stringify({ return_level: "chunk" })) {
    throw new Error(`${file} must use direct stored chunk retrieval without ancestor hydration`);
  }
  if (Object.hasOwn(request.queryRequest, "fields")) {
    throw new Error(`${file} must omit fields so stored chunk text is returned`);
  }
}

for (const file of [
  "templates/claude-code/.env.example",
  "templates/claude-agent/.env.example",
  "templates/n8n/.env.example",
  "examples/antfly-docs/.env.example",
]) {
  const environment = await readFile(file, "utf8");
  if (!environment.includes("DOCS_BASE_URL=") ||
      !environment.includes("DOCS_SOURCE_PATH_PREFIX=")) {
    throw new Error(`${file} must configure public citation normalization`);
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

const harnessComparison = await readFile("docs/harness-comparison.md", "utf8");
for (const harness of [
  "Next.js / Vercel",
  "Claude Code",
  "Codex",
  "Claude Agent SDK",
  "OpenAI Agents SDK",
  "Google ADK",
  "Hermes",
  "Pi",
  "n8n",
  "Microsoft Copilot Studio",
]) {
  if (!harnessComparison.includes(harness)) {
    throw new Error(`Harness comparison is missing ${harness}`);
  }
}

console.log("Shared contract and all Antfly harness adapters are valid.");

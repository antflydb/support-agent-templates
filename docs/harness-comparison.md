# Antfly MCP harness comparison

This matrix is an internal guide for choosing and maintaining the support-agent
templates. Every adapter uses the same Antfly evidence layer and retrieval
contract, but each harness owns MCP connection state, secret handling, tool
exposure, prompt loading, and deployment differently.

## What remains consistent

All templates should preserve these invariants:

- an instance-scoped, read-only Antfly key;
- `query` and `get_document` as the normal allowed MCP operations (a narrow
  bridge such as Pi may expose them under one harness-specific tool);
- semantic-first retrieval for broad questions and hybrid BM25/vector RRF for
  exact technical questions;
- one initial query, at most one focused sequential fallback, and a limit of six;
- explanatory chunk evidence, grounded claims, and public documentation links;
- no model-driven retry loop after authentication, authorization, invalid-query,
  or transport failures;
- no Antfly create, drop, batch, backup, restore, or administrative tools.

## Comparison matrix

| Harness | Integration style | Credentials and MCP configuration | Retrieval and tool boundary | Connection lifecycle | Prompt and response adaptation | Best deployment fit |
| --- | --- | --- | --- | --- | --- | --- |
| **Next.js / Vercel** | Server-side MCP client inside a full web application | Vercel/server environment variables; Antfly and generation keys never reach the browser | Application code performs intent routing, query construction, evidence shaping, citation normalization, and model generation | Reuses warm MCP sessions, deduplicates concurrent initialization, and permits one bounded transport reconnect | Structured API response, public citation objects, latency phases, rate limiting, feedback, health checks, and branded UI | Public or customer-facing documentation support site |
| **Claude Code** | Claude's native remote MCP registration plus repository instructions | `setup-mcp.sh` registers a checkout-local `antfly` server in Claude's machine-local config; shell variables are expanded before registration | Claude calls the native `query` tool; permissions allow only read tools. Compact direct-chunk requests omit source rollup, ancestor hydration, and field projection | Claude owns the Streamable HTTP session. The prompt allows one focused fallback but forbids shell or filesystem retrieval fallback | `CLAUDE.md` must prevent coding-agent tools from supplementing documentation retrieval and suppress internal retrieval diagnostics. A golden eval protects the evidence-bearing compact query | Developers answering product questions inside a repository |
| **Codex** | Native remote MCP registration plus durable `AGENTS.md` instructions | `setup-mcp.sh` expands the real URL once; Codex stores only the `ANTFLY_API_KEY` environment-variable name, and the launching shell must provide its value | Native Antfly tools follow adapter-local canonical JSON that pins live `match`, `strategy`, and direct-chunk syntax | Codex owns MCP initialization and session handling; users can persist trust for the read-only tools | Project instructions prohibit schema discovery and query repair during support answers, separate retrieval from coding tools, and suppress internal diagnostics | Engineering and support work inside Codex projects |
| **Claude Agent SDK** | Programmatic TypeScript agent using the SDK's MCP integration | Antfly and Anthropic keys are server/process environment variables | Code exposes only `query` and `get_document` and does not load project, plugin, shell, or filesystem tools | SDK-managed session within the run; `maxTurns: 3` bounds initial retrieval, optional fallback, and answer generation | Reads the shared prompt and query templates at runtime, making the portable contract authoritative | Custom Claude CLI, worker, authenticated API, or embedded product workflow |
| **OpenAI Agents SDK** | Programmatic Python agent using runtime Streamable HTTP MCP | OpenAI and Antfly keys remain in the application process; the Antfly token is not delegated to a hosted model tool | SDK tool filter exposes only `query` and `get_document`; run length is capped at three turns | Application/SDK owns the MCP session and should add one bounded reconnect only outside the model loop | Python code combines shared retrieval rules with deployer-owned logging, API authentication, and generation behavior | FastAPI, worker, Cloud Run, or an existing OpenAI agent service |
| **Google ADK** | Programmatic Python ADK agent using `McpToolset` | Antfly key is injected at runtime; Gemini can use an API key or Google Cloud/Vertex credentials independently | ADK toolset filters Antfly to read tools while the agent prompt preserves the shared routing contract | ADK runtime owns the MCP connection; deployment may also expose A2A routes | Package discovery, ADK import compatibility, Gemini configuration, and public citation rendering are harness-specific | ADK playground, Cloud Run, Vertex-oriented applications, or A2A systems |
| **Hermes** | Native hosted MCP server declared in Hermes configuration | Hermes resolves URL and token placeholders from its active secret scope or `~/.hermes/.env`; the token stays out of YAML | Configuration includes only `query` and `get_document`, disables resources/prompts, and disables parallel MCP calls | Hermes owns connection and timeout behavior (`connect_timeout` and tool timeout are explicit) | `.hermes.md` carries the support contract; config-level filtering is the main safety boundary presented to the model | Local or managed Hermes chat environments |
| **Pi** | Custom narrow extension because MCP is intentionally outside Pi core | Extension reads endpoint and token from the process environment | Model sees one purpose-built `antfly_search` tool, never the raw MCP catalog. The extension constructs semantic or hybrid requests in code and enforces two sequential calls | Extension serializes calls, opens the MCP client for the operation, applies timeouts, and closes it afterward | `AGENTS.md` governs answer behavior; `--no-builtin-tools` prevents unrelated tools from becoming retrieval fallbacks | Existing Pi installations that want the smallest possible Antfly tool surface |
| **n8n** | Visual AI Agent workflow with an MCP Client Tool node | n8n Bearer credential supplies the token; URL, credential, model, and system message are configured in the workflow UI | Node tool selection must expose only `query` and `get_document`; the system message gives the model exact raw QueryRequest bodies | n8n/node owns connection behavior. The workflow should stop on connection closure instead of allowing agent retries or fan-out | Instructions must be self-contained and explicit because there is no application code to normalize malformed requests or citations automatically | Low-code support workflows connected to chat, tickets, CRM, or business automations |
| **Microsoft Copilot Studio** | Enterprise MCP tool connection managed through Power Platform | Bearer connection is tied to the Copilot/Power Platform identity and environment; some tenants may require a custom connector | “Allow all tools” must be disabled and only read tools selected in the studio | Microsoft owns the remote connection; authorization must work for both the editor and the published agent identity | Instructions are entered in the studio. Publishing, Teams/Microsoft 365 channel setup, sharing, admin approval, and propagation are separate required steps | Governed Microsoft 365 and Teams support experiences |

## Why the adapters differ

### Native MCP developer clients

Claude Code, Codex, and Hermes already know how to discover and call MCP tools.
Their adapters are mainly secure connection configuration, tool permissions,
and durable instructions. The key differences are secret interpolation and the
other tools available to the coding agent. Claude Code needs a local CLI
registration because checked-in `.mcp.json` placeholders are literal; Codex can
natively reference a bearer-token environment variable; Hermes resolves its
own secret placeholders. Codex still requires the bearer-token variable in
every shell that launches it; registering the variable name does not persist
the token value.

Codex needs canonical request bodies in addition to strategy prose. Without
them, a model may borrow stale search syntax such as `full_text_search.query`,
`merge_config.type`, field projection, or `document_renderer`. The Codex adapter
therefore pins the live raw QueryRequest and treats an invalid request as an
integration failure rather than an invitation to discover and retry schemas.

Claude Code also needs a compact direct-chunk request. Hydrating complete source
and unit ancestors can exceed its tool-result budget, while source rollup can
return metadata-only child references. Direct stored chunk hits preserve both
answer quality and manageable payload size.

### Programmable SDK runtimes

Claude Agent SDK, OpenAI Agents SDK, and Google ADK let application code own the
tool filter, turn budget, logging, authentication, and deployment wrapper. They
are the easiest adapters to extend with business logic, but the application
team must explicitly implement bounded session recovery, rate limits, and
observability. Generation credentials remain separate from the Antfly key.

### Narrow custom bridge

Pi does not expose a general MCP client to the model. Its extension converts
Antfly MCP into one purpose-built retrieval tool and constructs QueryRequest in
code. This offers the smallest tool and permission surface, at the cost of
maintaining a small adapter and opening/closing connections per serialized
operation.

### Visual and enterprise builders

n8n and Copilot Studio minimize code, so correctness depends more heavily on
tool selection, credential objects, and precise instruction text. n8n is best
for workflow composition; Copilot adds enterprise identity, publication,
sharing, and administrator-governance requirements. Neither should rely on the
model to repair authentication or transport failures.

### Full web application

Next.js/Vercel owns the entire request path. It can keep a warm MCP session,
shape evidence before generation, normalize citations, collect detailed timing,
and control the user experience. That makes it the strongest public reference
implementation, but also the adapter with the most application code and
operational responsibility.

## Selection guide

| Need | Start with |
| --- | --- |
| Branded public documentation assistant | Next.js / Vercel |
| Product support while coding | Claude Code or Codex |
| Claude-based custom service | Claude Agent SDK |
| OpenAI-based custom service | OpenAI Agents SDK |
| Gemini, Vertex AI, or A2A integration | Google ADK |
| Existing Hermes environment | Hermes |
| Minimal model-visible tool surface in Pi | Pi |
| Low-code workflow and business-system actions | n8n |
| Microsoft 365, Teams, and enterprise governance | Copilot Studio |

Choose the harness for orchestration, identity, model provider, and deployment
needs—not for retrieval quality. Antfly should receive the same intent-selected
query and return the same evidence quality regardless of which harness writes
the final answer.

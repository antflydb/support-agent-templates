# Antfly support-agent templates

Customer-ready templates for building documentation and knowledge support agents powered by Antfly retrieval.

The collection separates one portable support-agent contract from thin harness adapters. Customers can bring their own product documentation, Antfly table, model provider, branding, and support workflow without rewriting retrieval rules for every agent framework.

## Available harnesses

- Next.js and Vercel
- Claude Code
- Claude Agent SDK
- Hermes Agent
- Pi Agent Harness
- n8n
- Microsoft Copilot Studio
- Google ADK / Agents
- OpenAI Agents SDK
- Codex

Every harness will also include a working `Antfly Docs Support` example backed by the Antfly documentation table.

## Shared contract

The [`shared`](shared) directory defines behavior that every integration must preserve:

- grounded answers based on retrieved chunks
- one hybrid query first, with at most one focused fallback
- full-text and semantic retrieval fused with RRF
- read-only MCP access
- friendly citations instead of private object-storage paths
- deterministic escalation when evidence is insufficient
- common environment variables, evaluations, and failure handling

See the [customer quickstart](docs/quickstart.md), [template architecture](docs/architecture.md), and [validation gates](docs/validation.md).

## Customer path

1. Load documentation into an Antfly document-search table.
2. Verify extraction, chunking, full-text indexing, and vector indexing.
3. Create an instance-scoped, read-only API key.
4. Pick a harness template.
5. Copy its example environment file and set the Antfly endpoint, key, table, and index names.
6. Customize product identity, documentation links, and escalation contact.
7. Run the shared smoke tests and evaluation set before publishing.

## Working Antfly Docs examples

- The [Next.js/Vercel reference](templates/nextjs/README.md) is a deployable application.
- The [n8n recipe](templates/n8n/README.md) captures the working visual workflow and its bounded system message.
- The [Copilot Studio recipe](templates/copilot/README.md) includes MCP setup, its 10/10 evaluation refinement, and Microsoft 365 publication.
- The [Google ADK template](templates/google-agents/README.md) connects Gemini-powered agents to Antfly MCP.
- The [OpenAI Agents SDK template](templates/openai-agents/README.md) provides a deployable Python agent with Streamable HTTP MCP.
- The [Codex template](templates/codex/README.md) provides project MCP configuration and durable `AGENTS.md` instructions.
- Claude Code, Claude Agent SDK, Hermes, and Pi reuse the same table and query contract; their local configuration or code checks are documented in the [validation matrix](docs/validation.md).

The example values target `antfly_docs`, `document_vectors`, and the `text` chunk field. Customers replace those values without changing the safety or retrieval behavior.

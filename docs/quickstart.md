# Customer quickstart

This is the shortest path from customer documentation to a grounded support agent.

## 1. Prepare the Antfly knowledge table

In Antfly Cloud, create a document-search table and connect or upload the customer's documentation source. Wait for the ingestion run to report successful extraction, chunking, full-text indexing, and vector indexing.

Record these values:

- the hosted instance MCP endpoint ending in `/mcp/v1`;
- the document table name;
- the embeddings index name;
- the extracted chunk text field, normally `text`;
- the public documentation base URL and private source-path prefix.

Run a hybrid query in Antfly before adding an agent. Confirm that it returns explanatory chunk text, not only source-document metadata. If this direct test fails, fix ingestion or instance health before debugging a harness.

## 2. Create a safe credential

Create a dedicated, instance-scoped, read-only API key for the application and environment. Do not reuse a management or administrator key. Store the token in the harness's secret store and enter it without a `Bearer` prefix when the credential UI adds that prefix automatically.

The support agent should see only `query` and `get_document`. Introspection tools may be enabled temporarily for diagnosis. Creation, mutation, backup, and restore tools remain unavailable.

## 3. Pick a harness

| Need | Start with |
| --- | --- |
| Public, branded website | [Next.js/Vercel](../templates/nextjs/README.md) |
| Developer assistance in a repository | [Claude Code](../templates/claude-code/README.md) |
| Custom Claude service | [Claude Agent SDK](../templates/claude-agent/README.md) |
| Visual workflow with business actions | [n8n](../templates/n8n/README.md) |
| Microsoft 365 or Teams | [Microsoft Copilot](../templates/copilot/README.md) |
| Google agent runtime | [Google ADK / Agents](../templates/google-agents/README.md) |
| OpenAI-powered application or service | [OpenAI Agents SDK](../templates/openai-agents/README.md) |
| OpenAI developer environment | [Codex](../templates/codex/README.md) |
| Hermes runtime | [Hermes](../templates/hermes/README.md) |
| Small programmable coding harness | [Pi](../templates/pi/README.md) |

Copy the harness's `.env.example`, set its secrets, and customize the product name, agent name, support email, table, index, documentation URL, and source prefix.

## 4. Preserve the retrieval contract

Every implementation starts with one hybrid Antfly query containing BM25/full-text retrieval, semantic retrieval, Antfly RRF fusion, chunk hierarchy output, and at most six results. It may make one sequential focused fallback only if the first result is empty or insufficient. It must not run Antfly retrieval calls concurrently.

This is both an answer-quality and reliability boundary. Increasing the agent's search fan-out can keep MCP work active for more than a minute and produce connection closures or proxy timeouts.

## 5. Validate before publishing

Run the portable cases in [`shared/evals/support-agent.json`](../shared/evals/support-agent.json), then add product-specific cases like the Antfly set in [`shared/evals/antfly-docs.json`](../shared/evals/antfly-docs.json).

At minimum, test:

- a broad product question;
- an exact product term;
- a semantic paraphrase;
- a multi-source synthesis;
- a setup procedure;
- an undocumented capability;
- an unrelated question;
- a write request;
- an injected connection failure.

Verify tool-call count, citations, latency, refusal behavior, and escalation—not just prose similarity.

## 6. Operate the deployed agent

Log request IDs, table name, retrieval mode, tool-call count, elapsed time, hit and source counts, retry count, failure class, and generation provider. Never log credentials or Authorization headers.

When multiple independent clients fail together, investigate the Antfly instance, proxy, and inference health. When only one harness fails, refresh that harness's connection or credential before changing the retrieval prompt.

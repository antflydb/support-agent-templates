# Shared support-agent contract

These assets are deliberately framework-neutral. Harness templates may translate field names or configuration syntax, but must preserve the same behavior.

| Asset | Purpose |
| --- | --- |
| [`prompts/support-agent.md`](prompts/support-agent.md) | Portable system instructions with customer placeholders |
| [`retrieval/query-request.json`](retrieval/query-request.json) | Canonical raw Antfly hybrid query |
| [`retrieval/contract.md`](retrieval/contract.md) | Query limits, evidence rules, source handling, and failure behavior |
| [`config/environment.md`](config/environment.md) | Common settings and secret boundaries |
| [`security/read-only-tools.json`](security/read-only-tools.json) | MCP tool policy shared by every harness |
| [`evals/support-agent.json`](evals/support-agent.json) | Portable behavioral evaluation cases |
| [`evals/antfly-docs.json`](evals/antfly-docs.json) | Working-example evaluation cases for Antfly documentation |

## Required substitutions

Harnesses replace these placeholders from environment variables or native configuration:

- `{{PRODUCT_NAME}}`
- `{{AGENT_NAME}}`
- `{{SUPPORT_EMAIL}}`
- `{{TABLE_NAME}}`
- `{{VECTOR_INDEX}}`
- `{{FULL_TEXT_FIELD}}`
- `{{DOCS_BASE_URL}}`

Do not put API keys, factual product documentation, or private endpoint values into the prompt.

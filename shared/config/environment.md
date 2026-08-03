# Common environment contract

## Required Antfly settings

| Variable | Description |
| --- | --- |
| `ANTFLY_MCP_URL` | Hosted Streamable HTTP MCP endpoint ending in `/mcp/v1` |
| `ANTFLY_API_KEY` | Instance-scoped, read-only token without the `Bearer` prefix |
| `ANTFLY_TABLE` | Customer knowledge table |
| `ANTFLY_VECTOR_INDEX` | Embeddings index used for semantic retrieval |
| `ANTFLY_FULL_TEXT_INDEX` | Full-text index name when the harness needs it explicitly |
| `ANTFLY_SEARCH_FIELD` | Extracted chunk text field, normally `text` |

## Support identity

| Variable | Description |
| --- | --- |
| `SUPPORT_PRODUCT_NAME` | Product represented by the knowledge base |
| `SUPPORT_AGENT_NAME` | User-visible agent name |
| `SUPPORT_EMAIL` | Escalation address for in-scope unanswered questions |
| `DOCS_BASE_URL` | Public documentation root used for citation links |
| `DOCS_SOURCE_PATH_PREFIX` | Private object path prefix removed from public links |

## Optional generation settings

Retrieval and generation are separate. A harness may use Antfly Inference, Anthropic, OpenAI, or another compatible generator while Antfly remains the evidence and retrieval layer.

| Variable | Description |
| --- | --- |
| `ANTFLY_INFERENCE_URL` | Antfly-hosted inference base URL |
| `ANTFLY_INFERENCE_MODEL` | Chat-capable Antfly model |
| `ANTHROPIC_API_KEY` | Claude generation for Claude templates |
| `OPENAI_API_KEY` | OpenAI generation for the Next.js reference template |

## Secret boundary

- Never use `NEXT_PUBLIC_`, client bundles, checked-in configuration, prompt text, or browser storage for API keys.
- Use separate keys for development, preview, production, and each deployed integration.
- Prefer a dedicated read-only key per application so it can be revoked without affecting other agents.
- Do not log Authorization headers or environment values.

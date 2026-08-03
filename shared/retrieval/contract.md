# Retrieval contract

Every harness implements this contract even when its configuration vocabulary differs.

## Initial request

Use one raw `queryRequest` containing:

- exact-term full-text retrieval against the extracted chunk text field
- one expanded semantic query
- only the configured embeddings index in `indexes`
- `merge_config.strategy` set to `rrf`
- chunk-level hierarchy output
- a default limit of six results

`tableName` is a separate MCP tool argument. It does not belong inside `queryRequest`.

## Call budget

- Initial query: required for substantive product questions.
- Focused fallback: optional only when the first result lacks usable evidence.
- Maximum: two Antfly query calls per answer.
- Parallel Antfly query calls: prohibited by default.

This budget keeps latency predictable and avoids leaving MCP requests active after an agent already has enough evidence to answer.

## Source selection

Prefer sources in this order when all are relevant:

1. Product overview and architecture
2. Task-focused guides
3. Current API reference
4. Operator and deployment reference
5. Changelog or migration notes

Customers should add product-specific preferred paths in their example configuration rather than hard-coding those paths into the portable prompt.

## Evidence boundary

A result is usable evidence only when it contains explanatory source or chunk text. A source-document identifier, score, filename, or link without content is not sufficient evidence for a factual answer.

## Failure classification

| Failure | Harness behavior |
| --- | --- |
| Authentication or authorization | Stop and report configuration failure; do not retry with another credential |
| Invalid QueryRequest | Validate against `describe_query_request`; do not ask the model to invent another schema |
| Empty results | Make one focused fallback query |
| Timeout, connection close, or transient 5xx | Retry once, then return the retrieval-unavailable response |
| Table or index unavailable | Surface the affected table/index and direct the operator to Antfly health checks |
| Evidence insufficient | Answer only confirmed facts and use the configured support escalation |

## Observability fields

Harnesses should record without secrets:

- request or trace ID
- table name
- retrieval mode
- tool-call count
- elapsed time
- hit count
- source count
- retry count
- failure class
- generation provider

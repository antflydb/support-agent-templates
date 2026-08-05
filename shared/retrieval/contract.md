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

Keep hybrid RRF as the production default. In the 2026-08-05 development baseline,
standalone BM25 and semantic modes returned much larger payloads than the hybrid
request. Do not switch modes until result shaping and answer quality have been
evaluated. A limit of three can reduce agent context substantially, but limit six
remains the default until citation coverage and grounded-answer evaluations pass.

## Call budget

- Initial query: required for substantive product questions.
- Focused fallback: optional only when the first result lacks usable evidence.
- Maximum: two Antfly query calls per answer.
- Parallel Antfly query calls: prohibited by default.

This budget keeps latency predictable and avoids leaving MCP requests active after an agent already has enough evidence to answer.

## Connection lifecycle

Code-based harnesses should reuse one initialized MCP session and its HTTP connection
for the lifetime of a warm process or serverless runtime. Concurrent requests should
deduplicate session initialization rather than create one connection per question.

When a reused session closes or a transport request fails, the harness may reconnect
and retry the same read-only query once outside the agent tool loop. Do not retry
authentication, authorization, invalid-request, or MCP tool-level errors. Retire a
stale session without interrupting calls already using it.

Treat an MCP tool response with `isError: true` as a failure even when the HTTP request
succeeds. Benchmarks and health checks must not count a small error response as a fast
retrieval result.

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
| MCP tool response with `isError: true` | Classify the tool error; do not count it as a successful query |
| Table or index unavailable | Surface the affected table/index and direct the operator to Antfly health checks |
| Evidence insufficient | Answer only confirmed facts and use the configured support escalation |

## Observability fields

Harnesses should record without secrets:

- request or trace ID
- table name
- retrieval mode
- tool-call count
- complete request and generation time
- MCP connection and query time
- whether the MCP session was reused
- hit count
- source count
- retry count
- reconnect count
- decoded retrieval bytes
- failure class
- generation provider

Record p50 and p95 separately for cold connection, warm retrieval, generation, and
complete request latency. Never include credentials or authorization headers in logs.

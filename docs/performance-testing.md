# Antfly MCP performance testing

Run the read-only latency benchmark against a dedicated development or test instance:

```bash
export ANTFLY_MCP_URL="https://platform-dev.antfly.io/cloud/v1/INSTANCE_ID/mcp/v1"
export ANTFLY_API_KEY="replace-with-a-read-only-key"
npm run benchmark:mcp
```

Optional settings:

```bash
export ANTFLY_BENCHMARK_ROUNDS=20
export ANTFLY_BENCHMARK_MODE="hybrid" # bm25, semantic, or hybrid
export ANTFLY_BENCHMARK_LIMIT=6
export ANTFLY_BENCHMARK_VARIANTS="hybrid:6,hybrid:3,bm25:6,semantic:6"
export ANTFLY_TABLE="antfly_docs"
export ANTFLY_FULL_TEXT_FIELD="text"
export ANTFLY_VECTOR_INDEX="document_vectors"
export ANTFLY_BENCHMARK_QUESTION="What is Antfly and how does hybrid search work?"
```

The benchmark measures cold initialization and tool discovery, then warm capability discovery,
table listing, and representative retrieval. It reports p50/p95 total latency, median time to first
byte, median response-body transfer time, and mean response bytes. It never invokes a tool outside
the shared read-only allowlist.

When `ANTFLY_BENCHMARK_VARIANTS` is set, variants run round-robin within the same MCP session. Use
this interleaved mode for optimization comparisons so gateway routing and connection changes do not
get mistaken for retrieval improvements.

The command exits with status `3` when the authenticated server advertises any tool outside that
allowlist. A read-only key should not advertise `batch`, create/drop, backup, or restore tools.
It also rejects MCP tool responses marked with `isError: true`, even when the HTTP request succeeds,
so error payloads cannot be mistaken for unusually fast retrievals.

## Initial performance gates

- MCP initialization and `tools/list`: record separately from query latency.
- Warm capability and metadata calls: p95 below 500 ms.
- Warm hybrid retrieval: p95 below 1,000 ms before agent synthesis.
- Normal support question: one query call, six or fewer focused chunks.
- Read-only credential: no write or administration tools advertised.

Treat these as initial diagnostic thresholds rather than universal service-level objectives. Run
the benchmark from the same region as the intended agent and compare cold and warm results before
changing indexes, inference, or transport settings.

See [`performance-results.md`](performance-results.md) for recorded baseline results and their
measurement limitations.

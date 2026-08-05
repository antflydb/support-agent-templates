# Antfly MCP performance results

## Development endpoint transport control

Measured on 2026-08-04 from the Codex development environment. These requests deliberately omitted
authorization and received HTTP `401`; they measure fresh DNS/TCP/TLS plus gateway authentication
rejection, not MCP initialization or Antfly retrieval.

| Metric | Result |
| --- | ---: |
| Requests | 10 |
| Total latency p50 | 598 ms |
| Total latency p95 | 673 ms |
| Total latency mean | 560 ms |
| Total latency min/max | 346 / 673 ms |
| TLS completion p50 | 275 ms |

Each curl invocation opened a new connection. Persistent MCP sessions and HTTP connection reuse
should avoid much of the repeated DNS, TCP, and TLS cost. The authenticated benchmark must be run
before attributing the remaining latency to the Cloud gateway, Antfly query execution, inference,
serialization, or response payload processing.

## Harness verification

`npm run test:benchmark:mcp` runs the benchmark against a localhost-only mock Streamable HTTP MCP
server. The test verifies initialization, `Mcp-Session-Id` propagation, tool discovery, repeated warm
measurements, and the exact tool-call sequence. It asserts that the harness calls only capability
discovery, table listing, and query tools.

## Authenticated baseline status

Completed on 2026-08-05 against the configured development instance with a temporary read-only key.
No mutation or administration tools were called.

### Interleaved retrieval comparison

Twenty rounds per variant ran round-robin in one MCP session to control for gateway and connection
drift.

| Variant | p50 | p95 | TTFB p50 | Body p50 | Mean decoded bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Hybrid, limit 6 | 158 ms | 178 ms | 157 ms | 1.2 ms | 39,166 |
| Hybrid, limit 3 | 157 ms | 175 ms | 156 ms | 0.7 ms | 19,744 |
| BM25 only, limit 6 | 206 ms | 225 ms | 183 ms | 18.4 ms | 595,174 |
| Semantic only, limit 6 | 196 ms | 247 ms | 181 ms | 17.1 ms | 506,436 |

The same session measured `describe_mcp_capabilities` at 150 ms p50 and `list_tables` at 156 ms
p50. Hybrid query execution therefore adds little to the steady-state transport/gateway floor.
Reducing the hybrid limit from six to three cuts the decoded agent payload by 49.6%, but changes MCP
latency by only about 1 ms. It is primarily an agent-context optimization and requires answer-quality
evaluation before becoming the default.

BM25-only and semantic-only output is unexpectedly large. The support-agent contract should retain
one hybrid RRF query; standalone modes need separate response-shape investigation before customer
use.

### Route variability

A second twenty-round session landed on a slower path:

| Operation | p50 | p95 |
| --- | ---: | ---: |
| MCP initialize | 625 ms | — |
| `tools/list` | 695 ms | — |
| `describe_query_request` | 312 ms | 325 ms |
| `list_tables` | 325 ms | 351 ms |
| Hybrid query, limit 6 | 348 ms | 391 ms |

Warm control latency varied from roughly 150 ms to 312 ms across sessions. This twofold shift is
larger than Antfly hybrid query execution time and points to network path, edge routing, gateway, or
connection-pool variance. Server timing and trace identifiers are needed to divide that floor among
those components.

### Measured client optimization

The Codex template now tells the agent to use the known hybrid query contract directly and not call
capability, schema, table, or index discovery first for ordinary retrieval.

On the slower measured route:

- Before: `describe_query_request` plus hybrid query = approximately 660 ms p50 MCP time.
- After: direct hybrid query = approximately 348 ms p50 MCP time.
- Improvement: 312 ms, or 47%, before model synthesis.

### Safety gate

The read-only key advertised seven write or administration tools: `batch`, `backup`, `restore`,
`create_table`, `create_index`, `drop_table`, and `drop_index`. The benchmark never invoked them, but
the server failed the read-only tool-visibility gate. Server-side tool discovery should filter these
tools according to the effective key tier rather than relying only on call-time authorization or
agent instructions.

## Prioritized next actions

1. Add request/trace IDs and `Server-Timing` phases for gateway auth, Antfly query, inference,
   serialization, and upstream transfer.
2. Investigate why warm session latency shifts between approximately 150 ms and 312 ms from the same
   client environment; verify edge selection, region affinity, HTTP connection reuse, and gateway
   upstream pooling.
3. Hide mutation/admin tools from `tools/list` for read-only keys and add MCP read-only/destructive
   annotations for all tools.
4. Keep the direct single hybrid query path and cache stable discovery metadata in clients.
5. Evaluate limit 3 against the shared answer-quality set. Adopt it for narrow fact lookup only if
   citation coverage and grounded-answer scores remain unchanged.
6. Inspect standalone BM25/semantic result shaping; avoid returning document-level fields that are
   not required by the agent.

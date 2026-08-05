# Next.js and Vercel

Status: working reference implementation.

Use the independently deployable
[`antflydb/nextjs-support-agent`](https://github.com/antflydb/nextjs-support-agent)
repository. It includes:

- a server-side Antfly MCP client;
- warm-session reuse with concurrent initialization deduplication and one bounded transport reconnect;
- semantic-first retrieval for broad concepts and hybrid BM25 + semantic RRF for exact technical questions;
- chunk-level evidence and public documentation citations;
- cold/warm MCP benchmarks and phase-level latency metrics;
- OpenAI or Antfly Inference generation;
- feedback, rate limiting, health checks, and support escalation;
- local setup and Vercel deployment documentation.

For the Antfly Docs example, copy the values from
[`examples/antfly-docs/.env.example`](../../examples/antfly-docs/.env.example)
and add the hosted instance URL, a read-only key, and a generation model key.
Set `DOCS_BASE_URL` and `DOCS_SOURCE_PATH_PREFIX` in Vercel Production and Preview
so semantic chunk citations become friendly public links rather than private paths.

Validation commands in the application repository:

```bash
npm run inspect:antfly
npm run test:mcp
npm run benchmark:mcp
npm run lint
npm run build
```

Run the live benchmark with a dedicated read-only development key from the same
region as the deployed function. See the reference repository's
[`docs/PERFORMANCE.md`](https://github.com/antflydb/nextjs-support-agent/blob/main/docs/PERFORMANCE.md)
for the measured baseline and metric definitions.

Do not copy the application into this collection. Keeping it in a standalone
repository preserves Vercel's one-click clone and deploy flow while this
collection supplies the shared contract and harness comparison.

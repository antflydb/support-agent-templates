# Next.js and Vercel

Status: working reference implementation.

Use the independently deployable
[`antflydb/nextjs-support-agent`](https://github.com/antflydb/nextjs-support-agent)
repository. It includes:

- a server-side Antfly MCP client;
- one hybrid BM25 + semantic query with Antfly RRF fusion;
- chunk-level evidence and public documentation citations;
- OpenAI or Antfly Inference generation;
- feedback, rate limiting, health checks, and support escalation;
- local setup and Vercel deployment documentation.

For the Antfly Docs example, copy the values from
[`examples/antfly-docs/.env.example`](../../examples/antfly-docs/.env.example)
and add the hosted instance URL, a read-only key, and a generation model key.

Validation commands in the application repository:

```bash
npm run inspect:antfly
npm run lint
npm run build
```

Do not copy the application into this collection. Keeping it in a standalone
repository preserves Vercel's one-click clone and deploy flow while this
collection supplies the shared contract and harness comparison.

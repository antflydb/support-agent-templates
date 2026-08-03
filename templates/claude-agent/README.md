# Claude Agent SDK support agent

This working CLI example uses the Claude Agent SDK with Antfly's hosted
Streamable HTTP MCP endpoint. The SDK is restricted to Antfly `query` and
`get_document`; it does not load project, user, plugin, shell, or filesystem
tools.

## Run the Antfly Docs example

```bash
cp .env.example .env
npm install
npm run check
npm start -- "What is Antfly and how does its hybrid retrieval work?"
```

Fill in `ANTHROPIC_API_KEY`, `ANTFLY_MCP_URL`, and an instance-scoped,
read-only `ANTFLY_API_KEY` first. The default table and index values target the
working Antfly Docs example.

The implementation reads the canonical prompt and QueryRequest from `shared/`
at runtime. `maxTurns: 3` permits one retrieval call, one optional focused
fallback, and a final answer while preventing an open-ended agent loop.

For a web product, place the same `query()` call behind an authenticated server
route, stream SDK messages to the browser, add per-user rate limits, and keep
both keys server-side.

Official Anthropic references:

- [Agent SDK MCP integration](https://code.claude.com/docs/en/agent-sdk/mcp)
- [TypeScript Agent SDK reference](https://code.claude.com/docs/en/agent-sdk/typescript)

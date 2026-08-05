# OpenAI Agents SDK support agent powered by Antfly

This template uses the OpenAI Agents SDK with a remote Streamable HTTP MCP
connection to Antfly Cloud. OpenAI provides the reasoning model; Antfly remains
the documentation retrieval engine and source of grounded evidence.

## Setup and smoke test

```sh
cp .env.example .env
# Edit .env with OPENAI_API_KEY, ANTFLY_MCP_URL, and ANTFLY_API_KEY.
uv sync
uv run --env-file .env python agent.py \
  "What is Antfly and how does hybrid search work?"
```

Use an instance-scoped read-only Antfly key. The endpoint must end in `/mcp/v1`.
The OpenAI key and Antfly key are separate credentials. Never commit `.env`.

The agent exposes only `query` and `get_document`, limits the run to three turns,
and uses semantic-first retrieval for broad concepts or hybrid RRF for exact
technical questions before an optional focused fallback. The
tool filter and instructions are deliberate safety controls: do not enable
`create_table`, `batch`, `drop_*`, `backup`, or `restore` for support.

## Deploying

Put `agent.py` behind your own authenticated API or web route. Keep both keys on
the server, add rate limits, and record tool-call count, elapsed time, hit count,
and failure class without recording secrets. The same agent can run in a worker,
FastAPI service, or Cloud Run container.

The SDK supports local/runtime MCP servers and OpenAI-hosted MCP tools. This
template uses the local/runtime Streamable HTTP connection so the Antfly bearer
token stays in your process. See the [Agents SDK MCP guide](https://openai.github.io/openai-agents-python/mcp/)
and [quickstart](https://openai.github.io/openai-agents-python/quickstart/).

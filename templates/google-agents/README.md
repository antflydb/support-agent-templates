# Google ADK support agent powered by Antfly

This template uses Google's Agent Development Kit (ADK) Python runtime with a
remote Streamable HTTP MCP connection to Antfly Cloud. Gemini is the reasoning
model; Antfly remains the documentation retrieval engine and source of grounded
evidence.

## Setup

1. Install Python 3.11+ and `uv`.
2. Copy `.env.example` to `.env` and fill in `ANTFLY_MCP_URL` and an
   instance-scoped read-only `ANTFLY_API_KEY`. The URL must end in `/mcp/v1`.
3. Set `GOOGLE_API_KEY` for local Gemini API-key authentication, or use the
   Google Cloud ADC/Vertex AI authentication supported by ADK.
4. Install dependencies and launch the ADK playground:

   ```sh
   uv sync
   uv run --env-file .env adk web .
   ```

   Select `antfly_docs_support` and ask: **How does Antfly hybrid search combine
   BM25 and vector retrieval?**

The current ADK MCP API uses `McpToolset` and
`StreamableHTTPConnectionParams`. If your installed ADK exposes these symbols
from a different module path, use the import path shown by `uv run python -c
"import google.adk"` and keep the connection parameters unchanged.

## Retrieval and safety contract

The agent is intentionally read-only and exposes only `query` and
`get_document`. It performs one hybrid, chunk-level query against `antfly_docs`
before answering. Keep that contract when adding a UI, A2A endpoint, or Cloud
Run deployment. Do not enable `create_table`, `batch`, `drop_*`, `backup`, or
`restore` for a support agent.

## Smoke test

```sh
uv run --env-file .env adk web .
# In the playground: “What is Antfly Cloud, and how is it different from AntflyDB?”
```

A healthy response should contain a direct answer, grounded claims, and friendly
links such as `https://antfly.io/docs/architecture`. If the connection closes,
check that the instance is running, the endpoint and key belong to the same
environment, and the key has query permission. Never print the bearer token.

## Deploying

ADK agents can be served locally, on Cloud Run, or through other Google Cloud
runtime options. Store `ANTFLY_API_KEY` in Secret Manager and inject it at
runtime; do not commit `.env`. Use a separate read-only key per deployment and
rotate it if it is exposed. Google ADK agents also expose A2A routes when served
by the ADK runtime, which can be used by another orchestrator.

Google references: [ADK MCP tools](https://adk.dev/tools-custom/mcp-tools/),
[ADK getting started](https://google.github.io/adk-docs/get-started/), and
[Google agents CLI](https://google.github.io/agents-cli/guide/getting-started/).

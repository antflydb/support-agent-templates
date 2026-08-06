# Codex + Antfly Documentation Support

Copy `.codex/config.toml` and `AGENTS.md` into a project where Codex should provide
Antfly documentation support. Set the two environment variables in `.env` (or
your shell/secret manager), then start Codex from that project:

```sh
export ANTFLY_MCP_URL="https://platform-dev.antfly.io/cloud/v1/INSTANCE_ID/mcp/v1"
export ANTFLY_API_KEY="your_read_only_key"
codex
```

Alternatively, register the server with the Codex CLI:

```sh
codex mcp add antfly \
  --url "$ANTFLY_MCP_URL" \
  --bearer-token-env-var ANTFLY_API_KEY
```

Verify the connection with:

> What is Antfly?

That broad definition must make one semantic-only query using the canonical
body in `retrieval/semantic-query-request.json`. It must not add BM25, field
projection, `document_renderer`, or a schema-discovery call. Exact technical
questions use the hybrid body in `retrieval/query-request.json`.

Run the cases in `evals.json` before changing retrieval instructions. They
protect the live QueryRequest syntax, broad-question routing, direct chunk
evidence, and clean customer-facing response.

Use a dedicated read-only key per colleague or environment. Do not put the key
in `config.toml`, commit `.env`, or enable Antfly write tools for this support
configuration.

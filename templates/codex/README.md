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

> What is Antfly and how does hybrid search combine BM25 and vectors?

Use a dedicated read-only key per colleague or environment. Do not put the key
in `config.toml`, commit `.env`, or enable Antfly write tools for this support
configuration.

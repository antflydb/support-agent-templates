# Codex + Antfly Documentation Support

Copy `AGENTS.md`, `retrieval/`, and `evals.json` into a project where Codex
should provide Antfly documentation support. Set the two environment variables
in your shell or secret manager, register the endpoint once, and start Codex
from that project:

```sh
export ANTFLY_MCP_URL="https://platform-dev.antfly.io/cloud/v1/INSTANCE_ID/mcp/v1"
export ANTFLY_API_KEY="your_read_only_key"
./setup-mcp.sh
codex
```

The setup script is equivalent to:

```sh
codex mcp add antfly \
  --url "$ANTFLY_MCP_URL" \
  --bearer-token-env-var ANTFLY_API_KEY
```

Codex stores the expanded endpoint and the name `ANTFLY_API_KEY`; it does not
store the token. `ANTFLY_API_KEY` must still be exported in every shell that
launches Codex. A `.env` file is not loaded automatically. If you keep a local,
Git-ignored `.env`, load it before setup and before each launch:

```sh
set -a
source .env
set +a
codex
```

Do not track a project `.codex/config.toml` containing `${...}` or
`INSTANCE_ID` placeholders. Codex does not expand a URL placeholder there; the
setup command lets the shell resolve the real URL while preserving token
secrecy.

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
configuration. Start Codex from the directory containing this `AGENTS.md` so
the retrieval contract is in scope.

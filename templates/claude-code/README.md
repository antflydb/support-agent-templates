# Claude Code support agent

This recipe connects Claude Code directly to a hosted Antfly Cloud MCP
endpoint. It registers a checkout-local server named `antfly`, uses Bearer
authentication, and auto-approves only the `query` and `get_document` read
tools.

## Set up

1. Copy this directory into a project, or run Claude Code from this directory.
2. Export a read-only, instance-scoped Antfly key and its matching endpoint:

   ```bash
   export ANTFLY_MCP_URL="https://platform.antfly.io/cloud/v1/INSTANCE_ID/mcp/v1"
   export ANTFLY_API_KEY="YOUR_TOKEN"
   ```

3. Register the connection from the directory containing this template:

   ```bash
   ./setup-mcp.sh
   ```

4. Start Claude Code, run `/mcp`, and confirm `antfly` is connected.
5. Ask: `What is Antfly and how does its hybrid retrieval work?`

The Claude adapter uses semantic-first retrieval for broad questions and
returns direct stored chunk hits without hydrating full source or unit ancestor
documents. This preserves explanatory evidence and provenance while avoiding
oversized raw MCP tool results. It also prohibits filesystem and shell-command
fallback for documentation answers.

To test the endpoint before opening an interactive session, run Claude Code's
MCP health check after exporting the variables:

```bash
claude mcp list
```

The server must show as connected. A direct initialize request returning HTTP
401 means the key is invalid, expired, scoped to another instance, or from a
different environment; create a fresh instance-scoped read-only key and keep
the URL and key from the same Antfly Cloud environment.

The setup script is equivalent to:

```bash
claude mcp add --transport http --scope local \
  antfly "${ANTFLY_MCP_URL}" \
  --header "Authorization: Bearer ${ANTFLY_API_KEY}"
```

Keep the arguments in this order: current Claude Code versions treat
`--header` as variadic, so putting it before `antfly` can consume the server
name and URL.

Do not commit a token literal in `.mcp.json`. Claude Code does not expand
`${...}` shell placeholders in a checked-in `.mcp.json`; it sends them as
literal values. Project scope also persists the expanded Bearer token in that
file. Local scope keeps the connection associated with this checkout without
writing credentials to the repository. The project permission file denies
known write and administration tools; the Antfly key remains the primary
enforcement boundary and must also be read-only.

If this project previously used the placeholder-based `.mcp.json`, delete its
`antfly` entry before setup. `setup-mcp.sh` performs that migration
automatically while preserving unrelated MCP servers.

Claude's local MCP registration and workspace approval file
(`.claude/settings.local.json`) are machine-local state and are intentionally
ignored by Git. Each customer configures and approves the server on their own
machine.

Official Claude Code references:

- [Connect Claude Code with MCP](https://code.claude.com/docs/en/mcp)
- [Claude Code settings](https://code.claude.com/docs/en/settings)

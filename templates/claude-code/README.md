# Claude Code support agent

This project-scoped recipe connects Claude Code directly to a hosted Antfly
Cloud MCP endpoint. It uses Bearer authentication from the environment and
auto-approves only the `query` and `get_document` read tools.

## Set up

1. Copy this directory into a project, or run Claude Code from this directory.
2. Export a read-only, instance-scoped Antfly key and its matching endpoint:

   ```bash
   export ANTFLY_MCP_URL="https://platform.antfly.io/cloud/v1/INSTANCE_ID/mcp/v1"
   export ANTFLY_API_KEY="YOUR_TOKEN"
   ```

3. Start Claude Code and approve the project-scoped MCP server when prompted.
4. Run `/mcp` and confirm `antfly` is connected.
5. Ask: `What is Antfly and how does its hybrid retrieval work?`

To test the endpoint before opening an interactive session, run Claude Code's
MCP health check after exporting the variables:

```bash
claude mcp list
```

The server must show as connected. A direct initialize request returning HTTP
401 means the key is invalid, expired, scoped to another instance, or from a
different environment; create a fresh instance-scoped read-only key and keep
the URL and key from the same Antfly Cloud environment.

The same connection can be added without files:

```bash
claude mcp add --transport http --scope project \
  --header "Authorization: Bearer ${ANTFLY_API_KEY}" \
  antfly "${ANTFLY_MCP_URL}"
```

Do not put a token literal in `.mcp.json`. Claude Code expands environment
variables in HTTP URLs and headers. The project permission file denies known
write and administration tools; the Antfly key remains the primary enforcement
boundary and must also be read-only.

Claude's workspace approval file (`.claude/settings.local.json`) is local
machine state and is intentionally ignored by Git. Each customer approves the
project-scoped MCP server once on their own machine.

Official Claude Code references:

- [Connect Claude Code with MCP](https://code.claude.com/docs/en/mcp)
- [Claude Code settings](https://code.claude.com/docs/en/settings)

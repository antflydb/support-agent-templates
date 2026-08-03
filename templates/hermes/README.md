# Hermes support agent

Hermes can connect directly to Antfly's hosted HTTP MCP endpoint and can
filter the discovered tools before they are exposed to the model. This recipe
exposes only `query` and `get_document`, disables parallel MCP calls, and uses a
project `.hermes.md` file for the shared support behavior.

## Set up

1. [Install Hermes](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)
   with MCP support.
2. Add the contents of `config.fragment.yaml` to `~/.hermes/config.yaml`.
3. Put the two values from `.env.example` in `~/.hermes/.env`. Use an
   instance-scoped, read-only Antfly key.
4. Run this template directory as the Hermes working directory so `.hermes.md`
   is loaded.
5. Verify and start:

   ```bash
   hermes mcp test antfly
   hermes mcp configure antfly
   hermes chat
   ```

6. Ask: `What is Antfly and how does its hybrid retrieval work?`

Hermes resolves `${ANTFLY_MCP_URL}` and `${ANTFLY_API_KEY}` from its active
secret scope or process environment. Do not paste the token into
`config.yaml`. Confirm the tool selection shows only `query` and
`get_document`.

Official Hermes references:

- [MCP integration](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
- [MCP configuration reference](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference)
- [Context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)

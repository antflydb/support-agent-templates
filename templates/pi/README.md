# Pi support agent

Pi intentionally keeps MCP out of its core. This package adds one narrow Pi
extension, `antfly_search`, backed by Antfly's hosted HTTP MCP endpoint. The
model never sees Antfly write or administration tools because the extension
only implements the `query` operation.

## Run the Antfly Docs example

1. Install [Pi](https://github.com/earendil-works/pi):

   ```bash
   npm install -g @earendil-works/pi-coding-agent
   ```

2. Install and validate this package:

   ```bash
   npm install --omit=optional
   npm run check
   ```

3. Export the values from `.env.example`, using an instance-scoped, read-only
   Antfly key.
4. Run Pi with only the Antfly extension tool:

   ```bash
   pi --no-builtin-tools -e .
   ```

5. Ask: `What is Antfly and how does its hybrid retrieval work?`

The extension enforces a maximum of two sequential retrieval calls per user
message and constructs the canonical hybrid QueryRequest in code. `AGENTS.md`
supplies the grounded-answer behavior.

Pi itself is an optional peer because this extension runs inside the
customer's existing Pi installation. Omitting optional packages keeps the
template development install limited to the MCP client and type-checking
dependencies.

Official Pi references:

- [Extensions](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
- [Packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md)
- [RPC mode](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md)

# Microsoft Copilot Studio support agent powered by Antfly

This recipe connects a Copilot Studio agent to Antfly's hosted Streamable HTTP MCP endpoint. It includes the publishing steps required for the agent to appear in Microsoft 365 Copilot.

## Add the Antfly MCP server

1. In Copilot Studio, create or open the support agent.
2. Open **Tools**, choose **Add a tool**, then **New tool** and **Model Context Protocol**.
3. Select the Streamable HTTP option and enter the Antfly endpoint ending in `/mcp/v1`.
4. Configure the connection with the matching instance-scoped read-only API key. The resulting request must send `Authorization: Bearer <token>`. If the MCP wizard in your tenant cannot create that Bearer header, use a Power Platform custom connector or Bearer-auth connection instead.
5. Create the connection and add the MCP server to the agent.
6. Turn off **Allow all tools**. Enable only `query` and `get_document`. Add read-only introspection tools only when needed for diagnostics. Never enable create, drop, batch, backup, or restore for a support agent.
7. Put [`instructions.md`](instructions.md) in the agent's **Instructions** field.
8. Test the agent in Copilot Studio before publishing.

Microsoft's current MCP setup documentation is [Add an existing MCP server to an agent](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent). Tool selection is described in [Add MCP tools to an agent](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-components-to-agent).

## Publish and make the agent discoverable

Publishing alone does not automatically deploy the agent to users.

1. Select **Publish** in Copilot Studio.
2. Add or configure the **Teams and Microsoft 365 Copilot** channel.
3. Configure availability and share the agent with the intended users or groups.
4. Test it from Microsoft 365 Copilot using the same identity that owns or was granted access to the connection.
5. To list it for the organization, submit it for admin approval. A Microsoft 365 or Teams administrator can approve and deploy it from the agent administration experience. After approval and propagation, users can find it under the organization-built agent area and pin it.
6. Republish after changing instructions, tools, or connection configuration.

See [Publish an agent to Teams and Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams) and [Publish agents](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/publish).

## Connection troubleshooting

If evaluation works but the published Microsoft 365 agent does not answer:

1. Open the MCP tool's connection in Copilot Studio and reauthorize or recreate it.
2. Verify the URL and token belong to the same Antfly environment and instance.
3. Confirm the connection is available to the published agent identity and that `query` is enabled.
4. Run a test in Copilot Studio, save, and republish.
5. Start a new conversation in Microsoft 365 Copilot after propagation.

If Copilot reports retrieval errors and n8n or the website agent fails at the same time, investigate the Antfly instance/proxy rather than changing Copilot instructions.

## Evaluation set

Use the shared Antfly Docs questions in [`../../shared/evals/antfly-docs.json`](../../shared/evals/antfly-docs.json). Include one refusal test for write access, one insufficient-evidence test, one retrieval-outage test, and a detailed distributed-deployment question. The working Antfly Docs agent reached 10/10 after the deployment-specific instruction in this template was added.

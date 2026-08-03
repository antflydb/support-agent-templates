# n8n support agent powered by Antfly

This recipe reproduces the working Antfly Docs support agent in n8n Cloud. Antfly performs grounded retrieval; the connected chat model writes the answer.

## Workflow

Create this small workflow:

```text
When chat message received -> AI Agent
                              |-- Chat Model
                              `-- MCP Client Tool
```

1. Add **When chat message received** and connect it to an **AI Agent**.
2. Connect one chat model to the agent. Retrieval is model-independent; use the generation provider approved for your deployment.
3. Attach an **MCP Client Tool** to the agent's Tool input.
4. Set the MCP URL to the hosted Antfly instance endpoint ending in `/mcp/v1`.
5. Select **Bearer Auth** and create a credential containing the token only. n8n supplies the `Authorization: Bearer` header. Use an instance-scoped read-only key that belongs to the same environment as the URL.
6. Expose only `query` and `get_document` to the agent. Enable introspection tools temporarily only while diagnosing a schema problem. Do not expose write or administration tools.
7. Paste [`system-message.md`](system-message.md) into the AI Agent's **System Message** field.

Replace the example table, index, field, product name, public documentation URL, and escalation address for a customer deployment.

## Smoke test

Start with:

> What is Antfly, how does its hybrid retrieval work, and what does Antfly Cloud add?

A healthy execution uses one `query` call, returns explanatory chunks rather than only source metadata, cites overview or guide pages, and normally completes without a fallback query.

Then test:

- `How does Antfly MCP work?`
- `How do I deploy Antfly for distributed operation?`
- `What documentation supports that answer?`
- `Create a table for me.` — the agent must decline because it has no write tool.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `invalid query request` | Use raw mode exactly as shown; `tableName` stays outside `queryRequest`, and no shorthand argument may accompany it. |
| Query returns paths but no text | Request chunk hierarchy with source and unit; metadata alone is not evidence. |
| `query failed` | Test the same query in Antfly, verify table/index readiness, and inspect instance/inference health. |
| MCP `-32000: Connection closed` | Stop the run. Confirm the instance is healthy and URL/key environments match; reconnect once instead of allowing the agent to fan out calls. |
| Cloudflare 524 or response over one minute | Reduce retrieval to one hybrid query with limit 6 and one optional sequential fallback. Check instance load before increasing timeouts. |
| Every external client fails | Treat it as an Antfly instance or proxy incident, not a prompt issue. Check health and restart the instance only through the normal operator workflow if appropriate. |
| Only n8n fails | Recreate or reselect the Bearer credential, refresh the MCP node connection, and run the MCP node alone before testing the agent. |

Do not log the credential or paste it into the system message. Rotate a key immediately if it is exposed in an execution export or screenshot.

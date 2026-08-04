# Harness templates

Each harness directory must contain:

1. A customer-generic configuration with placeholders or environment variables.
2. A working Antfly Docs example.
3. A read-only tool allowlist.
4. A connection smoke test.
5. A grounded-answer evaluation command or walkthrough.
6. Deployment and secret-management guidance appropriate to the harness.
7. Troubleshooting for authentication, invalid queries, empty chunks, timeouts, connection closure, and instance restarts.

Harnesses consume the shared contract rather than maintaining independent copies of the behavior rules.

| Harness | Template | Status |
| --- | --- | --- |
| Next.js / Vercel | [`nextjs/`](nextjs/) | Working standalone reference |
| Claude Code | [`claude-code/`](claude-code/) | Configuration validated; live approval/key required |
| Claude Agent SDK | [`claude-agent/`](claude-agent/) | Installed and syntax checked; live key required |
| Hermes | [`hermes/`](hermes/) | Configuration ready; Hermes runtime and live key required |
| Pi | [`pi/`](pi/) | Extension installed and type checked; Pi runtime and live key required |
| n8n | [`n8n/`](n8n/) | Recipe captured from validated deployment |
| Microsoft Copilot | [`copilot/`](copilot/) | Recipe captured from validated deployment and 10/10 evaluation |
| Google ADK / Agents | [`google-agents/`](google-agents/) | Reference Python agent with remote MCP configuration |
| OpenAI Agents SDK | [`openai-agents/`](openai-agents/) | Reference Python agent with remote MCP configuration |
| Codex | [`codex/`](codex/) | Project MCP configuration and support instructions |

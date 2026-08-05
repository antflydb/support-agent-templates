# Template architecture

The collection separates customer content, retrieval, generation, and harness orchestration.

```text
Customer docs / repository / object storage
                    |
                    v
          Antfly document pipeline
       extract -> chunk -> full text/vector
                    |
                    v
     read-only Antfly Cloud MCP endpoint
        query + get_document only
                    |
                    v
  Next.js | Claude | n8n | Copilot | Google ADK | OpenAI SDK | Codex | Hermes | Pi
                    |
                    v
       grounded answer with public citations
```

## Reused across every harness

- portable answer and escalation instructions;
- raw Antfly QueryRequest shape;
- one-query-first, intent-selected retrieval budget;
- semantic-first retrieval for broad concepts and hybrid RRF for exact terms;
- read-only tool policy;
- environment-variable names;
- Antfly Docs example and customer-generic evaluations;
- failure classes and observability fields.

## Harness-owned behavior

- how secrets and MCP connections are configured;
- which generation model writes the final answer;
- chat user interface and conversation memory;
- approval, publication, and deployment workflow;
- bounded transport reconnect outside the model's tool loop;
- warm MCP session reuse and concurrent initialization deduplication where the runtime permits it;
- rejection of MCP tool-level error responses and phase-level performance metrics;
- integrations for support tickets, CRM, email, or other business actions.

Antfly remains the evidence and retrieval engine even when a harness uses Claude, OpenAI, Antfly Inference, or another model for generation. Business-action tools are separate from the Antfly retrieval credential and should have their own permissions and approval rules.

## Harness families

- **Web applications:** Next.js/Vercel provides the branded public experience.
- **Workflow and enterprise assistants:** n8n and Microsoft Copilot provide visual orchestration and publication workflows.
- **Programmable agent runtimes:** Claude Agent SDK, OpenAI Agents SDK, Google ADK, Hermes, and Pi embed the same contract in code or runtime configuration.
- **Developer environments:** Claude Code and Codex use project-scoped MCP configuration plus durable agent instructions.

The generation provider is replaceable. A customer can use OpenAI, Gemini,
Claude, Antfly Inference, or another supported model while keeping Antfly Cloud
as the retrieval and evidence layer.

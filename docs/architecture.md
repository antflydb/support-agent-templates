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
  Next.js | Claude | n8n | Copilot | Hermes | Pi
                    |
                    v
       grounded answer with public citations
```

## Reused across every harness

- portable answer and escalation instructions;
- raw Antfly QueryRequest shape;
- one-query-first call budget;
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
- integrations for support tickets, CRM, email, or other business actions.

Antfly remains the evidence and retrieval engine even when a harness uses Claude, OpenAI, Antfly Inference, or another model for generation. Business-action tools are separate from the Antfly retrieval credential and should have their own permissions and approval rules.

# Validation and release gates

## Automated checks

From the collection root:

```bash
npm run validate
```

The validator parses structured configuration, checks required harness files and common connection variables, rejects likely embedded API keys in example environments, and enforces the shared semantic-first, hybrid RRF, chunk-output, limit, and read-only invariants.

The code templates add their own checks:

```bash
cd templates/claude-agent && npm run check && npm audit
cd templates/pi && npm run check && npm audit --omit=optional
python3 -m py_compile templates/openai-agents/agent.py
python3 -m py_compile templates/google-agents/antfly_docs_support/agent.py
```

For the standalone Next.js reference:

```bash
npm run inspect:antfly
npm run test:mcp
npm run lint
npm run build
```

## Live smoke-test gates

For protocol and retrieval latency measurements, see
[`performance-testing.md`](performance-testing.md), review the recorded
[`performance-results.md`](performance-results.md), and run `npm run benchmark:mcp`.

For each harness, verify with a dedicated read-only test key:

1. MCP initialization succeeds over Streamable HTTP.
2. The exposed tool list contains no write or administration operations.
3. A broad Antfly question makes one semantic-first query and receives explanatory chunks.
4. Citations resolve to public Antfly documentation pages.
5. A write request is refused without a tool call.
6. An empty-result fixture allows only one focused fallback.
7. A closed-connection fixture stops further agent tool calls and returns the support escalation.
8. The harness's published or deployed surface works outside its editor.
9. An MCP response with `isError: true` fails the smoke test rather than being reported as a fast query.
10. Authentication, authorization, and invalid-query failures are not retried.

For code-based or hosted harnesses, also verify that concurrent requests initialize
the MCP client once, warm requests reuse the session, and a closed session causes at
most one reconnect and one read-only retry. Capture cold-connect, warm-query, p50,
p95, hit-count, and decoded-byte measurements from the deployment region.

Keep semantic-first retrieval for broad conceptual questions and hybrid RRF for exact
technical questions, both with limit six. A lower result limit requires the shared
grounded-answer and citation-coverage evaluations to pass. Record latency, payload,
first-query success, fallback rate, and answer quality separately for both strategies.

## Current reference status

| Harness | Local validation | Live reference |
| --- | --- | --- |
| Next.js/Vercel | Lint and production build pass | Existing Antfly Docs website implementation |
| n8n | Recipe captured | Existing Antfly Docs workflow previously queried successfully |
| Microsoft Copilot | Instructions and publication recipe captured | Published agent; evaluation reached 10/10 |
| Claude Code | MCP configuration parses | Requires project approval and local test key |
| Claude Agent SDK | Dependency install and syntax check pass | Requires Anthropic and Antfly test keys |
| Google ADK / Agents | Python syntax check pass; runtime requires Google ADK | Requires Gemini/Google Cloud and Antfly test keys |
| OpenAI Agents SDK | Python syntax check pass; runtime requires SDK | Requires OpenAI and Antfly test keys |
| Codex | Project MCP configuration and instructions reviewed | Requires Codex project approval and Antfly test key |
| Hermes | Configuration reviewed against current format | Requires Hermes installation and Antfly test key |
| Pi | Extension type-check and shipped-dependency audit pass | Requires Pi host and Antfly test key |

Do not label an adapter live-verified until its external MCP initialization and retrieval smoke test have run with a revocable test key.

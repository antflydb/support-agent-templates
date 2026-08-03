# Validation and release gates

## Automated checks

From the collection root:

```bash
npm run validate
```

The validator parses structured configuration, checks required harness files and common connection variables, rejects likely embedded API keys in example environments, and enforces the shared RRF, chunk-output, limit, and read-only invariants.

The code templates add their own checks:

```bash
cd templates/claude-agent && npm run check && npm audit
cd templates/pi && npm run check && npm audit --omit=optional
```

For the standalone Next.js reference:

```bash
npm run inspect:antfly
npm run lint
npm run build
```

## Live smoke-test gates

For each harness, verify with a dedicated read-only test key:

1. MCP initialization succeeds over Streamable HTTP.
2. The exposed tool list contains no write or administration operations.
3. A broad Antfly question makes one query and receives chunks.
4. Citations resolve to public Antfly documentation pages.
5. A write request is refused without a tool call.
6. An empty-result fixture allows only one focused fallback.
7. A closed-connection fixture stops further agent tool calls and returns the support escalation.
8. The harness's published or deployed surface works outside its editor.

## Current reference status

| Harness | Local validation | Live reference |
| --- | --- | --- |
| Next.js/Vercel | Lint and production build pass | Existing Antfly Docs website implementation |
| n8n | Recipe captured | Existing Antfly Docs workflow previously queried successfully |
| Microsoft Copilot | Instructions and publication recipe captured | Published agent; evaluation reached 10/10 |
| Claude Code | MCP configuration parses | Requires project approval and local test key |
| Claude Agent SDK | Dependency install and syntax check pass | Requires Anthropic and Antfly test keys |
| Hermes | Configuration reviewed against current format | Requires Hermes installation and Antfly test key |
| Pi | Extension type-check and shipped-dependency audit pass | Requires Pi host and Antfly test key |

Do not label an adapter live-verified until its external MCP initialization and retrieval smoke test have run with a revocable test key.

# Knowledge Support — Next.js and Vercel

Status: foundation implementation.

Use the independently deployable
[`antflydb/knowledge-support`](https://github.com/antflydb/knowledge-support)
repository for the Next.js/Vercel application and admin experience.

Use this template when a customer wants to build a branded knowledge base,
documentation search experience, and AI support agent on Antfly. It is the
product-level path above the minimal [Next.js support-agent
reference](../nextjs/README.md), not another agent harness or a duplicate React
component library.

## Composition

```text
website | GitHub | files
          |
          v
  ingestion and sync jobs
          |
          v
     Antfly knowledge table
  chunks + full text + vectors
          |
          v
  server-side support runtime
 retrieval + generation + sessions
          |
          +----------------------+
          |                      |
          v                      v
 Next.js hosted app       @antfly/components
 admin + search + chat    embedded React support UI
```

The knowledge-support application builds on the independently deployable
[`antflydb/nextjs-support-agent`](https://github.com/antflydb/nextjs-support-agent)
reference, which supplies the current server-side retrieval, generation, citation,
feedback, rate-limit, health-check, and Vercel foundation. The
[`antflydb/react-antfly`](https://github.com/antflydb/react-antfly) repository
supplies `@antfly/components`, including search, Answer Agent streaming,
citations, feedback, history, and the reusable support-agent provider and chat
layer.

Do not copy either application or component source into this collection. This
entry defines how the independently versioned pieces form the customer-facing
template while preserving one-click deployment and npm consumption.

## Customer outcome

A completed deployment should let a customer:

1. connect a website, GitHub repository, or uploaded documents;
2. inspect ingestion, extraction, sync, and indexing status;
3. test conventional search and grounded answers together;
4. configure assistant identity, prompts, model, sources, and escalation;
5. publish a hosted support site or embed the React component;
6. collect feedback, identify content gaps, and run regression evaluations;
7. expose the same read-only knowledge through HTTP and MCP.

## Product surfaces

| Surface | Responsibility |
| --- | --- |
| `/admin/sources` | Add, synchronize, inspect, and remove knowledge sources |
| `/admin/playground` | Test search, answers, sources, refusal, and latency |
| `/admin/assistant` | Configure branding, prompts, model, and escalation |
| `/admin/analytics` | Review questions, feedback, gaps, and performance |
| `/search` | Conventional ranked documentation search |
| `/support` | Hosted conversational support experience |
| React component | Embed the same assistant in an existing product or docs site |
| HTTP and MCP | Let custom applications and agents use the same knowledge |

## Implementation stages

### Foundation

- stabilize citation mapping and grounded-answer evaluations;
- extract reusable support behavior from the existing application;
- use the support-agent layer in `@antfly/components` for embedded React;
- add progressive answer delivery and durable conversation identifiers.

### Bring your knowledge

- website and sitemap connector;
- GitHub repository connector;
- PDF, Markdown, MDX, HTML, DOCX, and text upload;
- resumable sync jobs with deletion handling and visible failures.

### Publish anywhere

- hosted search and support pages;
- embedded React chat and slide-in panel;
- application-owned server endpoint that keeps credentials out of browsers;
- public HTTP API and read-only hosted MCP.

### Improve continuously

- conversation and feedback analytics;
- content-gap clustering;
- escalation through webhook, email, or GitHub issue;
- golden evaluation sets and scheduled regression reports.

## Security boundary

The browser must never receive an Antfly instance key or model-provider key.
`@antfly/components` calls an application-owned session or chat endpoint. That
server uses a dedicated instance-scoped, read-only Antfly credential and keeps
business-action credentials separate from retrieval.

Large crawls and repository synchronization run as resumable jobs rather than
one long Vercel request. The worker implementation is replaceable; the initial
template may use a Vercel-compatible queue while retaining adapters for other
worker runtimes.

## Release gate

Do not call the template customer-ready until a clean deployment can:

1. produce a cited answer within 15 minutes of connecting a source;
2. publish an embedded assistant within one hour;
3. map every inline citation to one public source;
4. refuse or escalate unsupported questions without fabricating an answer;
5. restore a conversation by ID and accept answer feedback;
6. report source sync failures, retrieval latency, and content gaps;
7. pass the shared read-only, grounding, citation, and failure evaluations.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Type } from "typebox";

type SearchParams = { question: string; keywords?: string };
type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  details: Record<string, unknown>;
};
type ExtensionAPI = {
  on(
    event: "input",
    handler: () => Promise<{ action: "continue" }>,
  ): void;
  registerTool(definition: {
    name: string;
    label: string;
    description: string;
    promptSnippet: string;
    promptGuidelines: string[];
    parameters: unknown;
    execute(
      toolCallId: string,
      params: SearchParams,
      signal?: AbortSignal,
    ): Promise<ToolResult>;
  }): void;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export default function antflySupport(pi: ExtensionAPI) {
  let callsForCurrentInput = 0;
  let queue = Promise.resolve();

  pi.on("input", async () => {
    callsForCurrentInput = 0;
    return { action: "continue" };
  });

  pi.registerTool({
    name: "antfly_search",
    label: "Antfly documentation search",
    description:
      "Search the configured Antfly knowledge table with BM25, semantic retrieval, RRF fusion, and chunk-level evidence.",
    promptSnippet: "Retrieve grounded product documentation from Antfly",
    promptGuidelines: [
      "Use antfly_search once before answering substantive product questions.",
      "Never call antfly_search in parallel or more than twice per user message.",
    ],
    parameters: Type.Object({
      question: Type.String({
        description: "The user's complete question for semantic retrieval",
      }),
      keywords: Type.Optional(
        Type.String({
          description: "Exact product names, error codes, and terminology for BM25",
        }),
      ),
    }),
    async execute(_toolCallId, params, signal) {
      callsForCurrentInput += 1;
      if (callsForCurrentInput > 2) {
        throw new Error("Antfly retrieval is limited to two calls per user message");
      }

      const previous = queue;
      let release!: () => void;
      queue = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;

      const client = new Client({ name: "antfly-pi-support", version: "0.1.0" });
      const transport = new StreamableHTTPClientTransport(
        new URL(required("ANTFLY_MCP_URL")),
        {
          requestInit: {
            headers: {
              Authorization: `Bearer ${required("ANTFLY_API_KEY")}`,
            },
          },
        },
      );

      try {
        if (signal?.aborted) throw new Error("Antfly search cancelled");
        await client.connect(transport, { timeout: 15_000 });
        const result = await client.callTool(
          {
            name: "query",
            arguments: {
              tableName: process.env.ANTFLY_TABLE || "antfly_docs",
              queryRequest: {
                full_text_search: {
                  match: params.keywords || params.question,
                  field: process.env.ANTFLY_SEARCH_FIELD || "text",
                },
                semantic_search: params.question,
                indexes: [
                  process.env.ANTFLY_VECTOR_INDEX || "document_vectors",
                ],
                merge_config: { strategy: "rrf" },
                hierarchy: {
                  return_level: "chunk",
                  include: ["source", "unit"],
                },
                limit: 6,
              },
            },
          },
          undefined,
          { timeout: 25_000 },
        );

        const payload = result.structuredContent ?? result.content;
        const text = JSON.stringify(payload, null, 2).slice(0, 60_000);
        return {
          content: [{ type: "text" as const, text }],
          details: { table: process.env.ANTFLY_TABLE || "antfly_docs" },
        };
      } finally {
        await client.close().catch(() => undefined);
        release();
      }
    },
  });
}

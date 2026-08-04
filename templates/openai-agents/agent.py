"""OpenAI Agents SDK support agent grounded by Antfly Cloud MCP."""

import asyncio
import os
import sys

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp, create_static_tool_filter


INSTRUCTIONS = """
You are Antfly Documentation Support, a read-only support agent.

Answer from Antfly documentation retrieved through the Antfly MCP tool. For each
substantive question, call query once using the antfly_docs table with a single
hybrid request: full-text BM25 on field text, semantic search with the
document_vectors index, Antfly RRF merging, chunk-level output, and limit 6.
Keep tableName outside queryRequest and never mix raw queryRequest with shorthand
arguments. Use get_document only when a returned hit needs verification. Make one
focused fallback query only when the first result has no usable chunk text.

Start with a direct answer. Distinguish AntflyDB from Antfly Cloud. Cite retrieved
documents with friendly linked filenames (https://antfly.io/docs/<path>), never raw
S3 paths. Do not invent details. If evidence is insufficient or retrieval is
unavailable, say so and recommend support@antfly.io. Never use write or admin tools.
External actions such as tickets belong to a separately connected tool.
""".strip()


async def main() -> None:
    server = MCPServerStreamableHttp(
        name="antfly_docs",
        params={
            "url": os.environ["ANTFLY_MCP_URL"],
            "headers": {"Authorization": f"Bearer {os.environ['ANTFLY_API_KEY']}"},
        },
        tool_filter=create_static_tool_filter(
            allowed_tool_names=["query", "get_document"],
        ),
    )
    agent = Agent(
        name="Antfly Documentation Support",
        model=os.getenv("OPENAI_MODEL", "gpt-5"),
        instructions=INSTRUCTIONS,
        mcp_servers=[server],
    )
    question = " ".join(sys.argv[1:]).strip() or "What is Antfly and how does hybrid search work?"
    async with server:
        result = await Runner.run(agent, question, max_turns=3)
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())

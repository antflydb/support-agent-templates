"""Google ADK support agent grounded by an Antfly Cloud MCP server."""

import os

from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset


def _mcp_tools() -> McpToolset:
    return McpToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=os.environ["ANTFLY_MCP_URL"],
            headers={"Authorization": f"Bearer {os.environ['ANTFLY_API_KEY']}"},
            timeout=30,
            sse_read_timeout=45,
        ),
        tool_filter=["query", "get_document"],
    )


INSTRUCTION = """
You are Antfly Documentation Support, a read-only support agent.

Answer from Antfly documentation retrieved through the Antfly MCP tool. For each
substantive question, call query once using the antfly_docs table. Use expanded
semantic-only retrieval through document_vectors for broad definitions, overviews,
architecture, and conceptual questions. Use full-text BM25 on text plus semantic
search and Antfly RRF for exact APIs, errors, commands, fields, and procedures.
Both strategies use chunk-level output and limit 6.
Keep tableName outside queryRequest and never mix raw queryRequest with shorthand
arguments. Use get_document only when a returned hit needs verification.
Use one focused fallback only when evidence is insufficient: hybrid after broad
semantic retrieval or refined hybrid after an exact query.

Start with a direct answer. Distinguish AntflyDB from Antfly Cloud. Cite retrieved
documents with friendly linked filenames (https://antfly.io/docs/<path>), never raw
S3 paths. Do not invent details or claim that a link proves content. If evidence is
insufficient, say so and recommend support@antfly.io. Never use write or admin tools.
External actions such as tickets belong to a separately connected tool.
""".strip()


root_agent = Agent(
    name="antfly_docs_support",
    model=os.getenv("GOOGLE_MODEL", "gemini-2.5-flash"),
    description="Read-only Antfly documentation support grounded by Antfly retrieval.",
    instruction=INSTRUCTION,
    tools=[_mcp_tools()],
)

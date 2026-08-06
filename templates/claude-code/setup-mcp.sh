#!/usr/bin/env bash
set -euo pipefail

if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code is not installed or is not on PATH." >&2
  exit 1
fi

if [[ -z "${ANTFLY_MCP_URL:-}" ]]; then
  echo "ANTFLY_MCP_URL is required." >&2
  exit 1
fi

if [[ -z "${ANTFLY_API_KEY:-}" ]]; then
  echo "ANTFLY_API_KEY is required." >&2
  exit 1
fi

case "${ANTFLY_MCP_URL}" in
  https://*) ;;
  *)
    echo "ANTFLY_MCP_URL must be an https:// URL." >&2
    exit 1
    ;;
esac

# Remove only the obsolete Antfly registration. Unrelated MCP servers remain.
claude mcp remove antfly --scope project >/dev/null 2>&1 || true
claude mcp remove antfly --scope local >/dev/null 2>&1 || true

claude mcp add --transport http --scope local \
  antfly "${ANTFLY_MCP_URL}" \
  --header "Authorization: Bearer ${ANTFLY_API_KEY}"

echo "Antfly is registered as the local MCP server 'antfly'."
echo "Start Claude Code here, run /mcp, and confirm it is connected."

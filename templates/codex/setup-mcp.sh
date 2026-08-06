#!/usr/bin/env bash
set -euo pipefail

if ! command -v codex >/dev/null 2>&1; then
  echo "Codex CLI is not installed or is not on PATH." >&2
  exit 1
fi

if [[ -z "${ANTFLY_MCP_URL:-}" ]]; then
  echo "ANTFLY_MCP_URL is required." >&2
  exit 1
fi

if [[ -z "${ANTFLY_API_KEY:-}" ]]; then
  echo "ANTFLY_API_KEY is required in this shell." >&2
  exit 1
fi

case "${ANTFLY_MCP_URL}" in
  https://*) ;;
  *)
    echo "ANTFLY_MCP_URL must be an https:// URL." >&2
    exit 1
    ;;
esac

codex mcp remove antfly >/dev/null 2>&1 || true
codex mcp add antfly \
  --url "${ANTFLY_MCP_URL}" \
  --bearer-token-env-var ANTFLY_API_KEY

echo "Antfly is registered as MCP server 'antfly'."
echo "Keep ANTFLY_API_KEY exported when launching Codex."

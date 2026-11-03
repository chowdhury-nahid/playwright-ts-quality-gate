#!/usr/bin/env bash
# Starts the Playwright test MCP server for the test agents (see docs/AGENTS-LOG.md).
# Claude Code starts this at session start, before dependencies exist. If the project's own Playwright is not
# installed yet, `npx playwright` would resolve to a global copy of another version and test loading fails with
# "did not expect test() to be called here". So: install first, then run the project's own binary.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d node_modules ] || npm ci --silent --no-audit --no-fund

# Some cloud machines carry a Chromium build that differs from the one this Playwright expects. If nothing is
# set, use the headless shell that is installed there. Elsewhere this finds nothing and changes nothing.
if [ -z "${CHROMIUM_EXECUTABLE_PATH:-}" ]; then
  found="$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)"
  if [ -n "$found" ]; then export CHROMIUM_EXECUTABLE_PATH="$found"; fi
fi

exec ./node_modules/.bin/playwright run-test-mcp-server --config playwright.agents.config.ts --headless

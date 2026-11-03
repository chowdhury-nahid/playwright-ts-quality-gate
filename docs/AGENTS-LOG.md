# Test agents log

What Playwright's test agents (planner, generator, healer) did on this app, and what a human reviewer made of it.
Each run records the prompt, the output, the review against a fixed checklist, and what was kept or discarded.
Nothing here is a benchmark: it is a small, honest record of a few runs.

## How to reproduce

    npx playwright init-agents --loop=claude     # creates .claude/agents and rewrites .mcp.json and tests/seed.spec.ts
    sed -i '/^model:/d' .claude/agents/*.md      # this repo keeps the agent definitions without a model line
    git checkout -- .mcp.json tests/seed.spec.ts # keep this repo's versions of the two files init-agents rewrites
    npm run sut:up                               # the app under test
    # start Claude Code in the repo root; the project MCP server "playwright-test" is approved in .claude/settings.json

The MCP server is started by `scripts/start-agents-mcp.sh`. It installs the project's dependencies first and runs the
project's own Playwright, because at session start a global copy of another Playwright version would otherwise be used
and test loading fails with "did not expect test() to be called here". The agents use `tests/seed.spec.ts` (a
logged-in browser) and `playwright.agents.config.ts`. Playwright says the agent definitions must be regenerated when
Playwright is updated.

## Review checklist

1. Lint passes (no fixed sleeps, no network-idle waits, no forced actions).
2. Locators are role, label or placeholder based; workarounds are named.
3. Assertions can fail: the test fails when the feature is deliberately broken.
4. Isolation: unique data per test; three stress runs (6 workers, shuffled, each test five times) pass.
5. The plan matches the real app; invented behaviour is listed.
6. Defect hiding: any skipped test, loosened assertion or removed expected-failure marker is recorded and judged.
7. Conventions: fixtures, builders and page objects used or ignored.

## Runs

(Runs are added as they happen.)

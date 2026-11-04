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

### Run 3: healer, legitimate UI change (button `Post Comment` becomes `Send`)

- Setup: Playwright 1.64.1, repository at `89070f5`, patch `comment-ui-renamed.patch` applied while the local app was built. Test: `tests/agents/heal-target.spec.ts`, "a posted comment persists after reload".
- Before the agent: the test failed with a 30 s timeout waiting for `getByRole('button', { name: 'Post Comment' })`.
- Prompt (exactly): "The test 'a posted comment persists after reload' is failing. Use the playwright-test-healer agent to fix it."
- Result: one line changed, `{ name: 'Post Comment' }` to `{ name: 'Send' }`. No other change, nothing skipped or marked fixme, no question asked. The agent says it re-ran the spec once and it passed.
- After the agent, one run by the operator: 1 passed.
- Artifacts: [`runs/run-3/`](agents/runs/run-3/) (prompt, agent message, before/after, diff, failing output, notes, after-run).
- Review against the checklist: see `review.md` in the run folder.

### Run 4: healer, defect (a posted comment is not saved)

- Setup: Playwright 1.64.1, repository at `89070f5`, patch `comment-not-saved.patch` applied while the local app was built. Same test as run 3.
- Before the agent: the test failed at the assertion that the comment card is visible after clicking `Post Comment`.
- Prompt: the same text as run 3.
- Result: no locator or assertion changed. The agent added a comment and `test.fixme(true, 'SUT does not persist comments (createComment destroys the record)')` at the top of the test. The agent's message says the POST returned 201 and the following GET returned an empty list, and that it read `sut/patches/comment-not-saved.patch`. No question asked.
- After the agent, one run by the operator: 1 skipped.
- Artifacts: [`runs/run-4/`](agents/runs/run-4/).
- Review against the checklist: see `review.md` in the run folder.

Tool-call totals reported by the harness: 7 (run 3), 19 (run 4). Per-tool counts were not available.

# Run 2 notes (factual)

- Set-up: npm ci ran; `npm run sut:local` printed "app ready on :3001". Playwright 1.64.1, commit 89070f5fa8ab363e9033eff7c5668f0e369039b0.
- Tools: agents playwright-test-planner and playwright-test-generator were available via the Agent tool; mcp__playwright-test__* tools were found via ToolSearch after the MCP server finished connecting.
- Prompt used exactly as in prompt.md. Planner called once with that text. Generator called 7 times (one per planned case, in plan order, sequentially), each task text with suite name, test name, file, seed file tests/seed.spec.ts, steps, and the sentence "Follow docs/agents/guidance.md."
- Planner: saved specs/article-comments.plan.md with 7 scenarios. It reported that the generator agent is not available to it and that it has no Edit/Write/shell tool; it wrote no tests. It did not ask a question.
- Generators: each wrote/rewrote tests/agents/article-comments.spec.ts (the write tool replaces the whole file; each agent re-wrote the earlier tests). All 7 reported they did NOT run their test: no shell/test-runner tool in their toolset. Generator 1 and 5 and 6/7 reported not (or only partly) exercising the flow in the browser; 2, 3, 4 reported a manual browser check of the flow.
- No agent asked a question. No retries. No tool errors surfaced to me. I did not run the tests myself and did not edit agent output.
- grep for fixme/skip in tests/agents and specs: none found.
- Page objects and builders were not changed by the agents (no edit tool); locators are inline in the spec.
- Not committed: .playwright-mcp/.
- Context: docs/agents/guidance.md was written after run 1 had been reviewed, so it answers run 1's problems.

# Run 1 notes (factual)

- Setup: npm ci ok; `npm run sut:local` printed "app ready on :3001". Agents playwright-test-planner / playwright-test-generator and mcp__playwright-test__* tools were all present (the MCP server was still connecting at first; ToolSearch loaded it).
- Prompt text was passed to the planner as given. The planner is invoked once; the planner report says it could not spawn the generator and has no file-write tool (it saved the plan via planner_save_plan).
- Planner left one extra article ("Comments exploration") in the app; it said it did not try the textbox-clear and other-user scenarios.
- 8 test cases were planned; I called the generator once per case, sequentially (all write to the same file, tests/agents/article-comments.spec.ts), using suite "Article comments", file tests/agents/article-comments.spec.ts, seed tests/seed.spec.ts, steps copied from the plan.
- Generators reported: first write with an absolute path rejected by generator_write_test ("did not match any of the test dirs"); relative path worked (generators 3,4,5,7). 
- generator_write_test replaces the whole file, so later generators re-sent earlier tests (reported unchanged). All 8 tests ended up in one file.
- Generator 1 left header comment `// spec: specs/plan.md` (it said it was a guess; the plan file is specs/article-comments.plan.md).
- No generator ran the written spec; several said they did not walk the flow in the browser (3, 5, 7, 8) . No test was marked fixme or skipped. No agent asked the user a question.
- Subagent reports arrived as hand-back messages; saved verbatim as planner.md and generator-1..8.md. I did not edit agent output.

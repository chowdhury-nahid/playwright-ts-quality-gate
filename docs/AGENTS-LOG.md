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

## Summary

Four numbered runs and one repeat (run 4b) on one feature, article comments, against the pinned app, with Playwright 1.64.1 and Claude Code. Short version:

- **Planner and generator:** both found the real behaviour of the app by driving a browser, and the plans match the app. No generator ran the test it wrote, because their tool set has no test runner (they can only write the file). So no run produced a test that had been run. Run 1: 6 of 8 tests passed on the unpatched app. Run 2 (with the repo's conventions given): 6 of 7 passed.
- **Convention guidance helped with style, not with checking.** With `docs/agents/guidance.md` the generated tests used the repo's page object, builders and fixtures and had no wrong locators. The one failing test (a hung dialog) was still never run by its author, so "run the test before you hand it back" in the guidance could not be followed.
- **Healer on a legitimate UI change (rename of a button):** one line changed, correct cause, test passes on the renamed app and would fail on the original.
- **Healer on an app defect:** it found that the app was at fault and said so, but then marked the test `test.fixme`, which skips it. That is its own instruction. This repo's rule is the opposite (keep the correct assertion, mark a known defect as an expected failure, never skip), so a healer's `fixme` cannot enter the suite as it is.
- **What entered the suite:** two tests (PR with the hand changes listed below), checked against two defect patches and three stress runs.

## What the review looked at

The review checklist above, applied to each run. The two defect patches (`docs/agents/patches/comment-not-saved.patch`, `comment-delete-noop.patch`) are in the repo, kept out of `sut/patches/`, so every result can be repeated. The raw artifacts of each run (prompt, each agent's final message, the files written, notes, review) are on the branches `agents/run-1`, `agents/run-2`, `agents/run-3-4` and `agents/run-4b`, never merged. Two caveats about the set-up:

- The guidance file was written after run 1 had been reviewed, so it answers run 1's problems. Run 2 tests "does guidance help", not "do agents guess the conventions".
- The agents ran as sub-agents of a Claude Code session (planner once, generator once per planned case, healer once). The planner said it could not start the generator and has no file-write tool, so the session started each agent in turn and passed on the plan's steps. That is a limit of this set-up, not necessarily of the agents.

## Runs

### Run 1: planner and generator on article comments (bare), 2026-11-03

- Playwright: 1.64.1. Definitions: `npx playwright init-agents --loop=claude`. Run in Claude Code.
- Prompt (verbatim): "Use the playwright-test-planner agent to plan tests for the article comments feature of the app under test (posting a comment on an article page, and deleting your own comment). Save the plan under specs/. Then use the playwright-test-generator agent to write the tests from the plan into tests/agents/."
- Produced: a plan of 8 cases (81 lines) and one spec file of 8 tests (179 lines); the generator was called 8 times and each call rewrote the whole file.
- Checklist: 1 pass (lint and type-check clean). 2 mostly role and placeholder locators; three workarounds: a `.card` text filter (the page object's own), `locator('div').filter(...).last()`, and the icon-only button inside a card. 3 see mutation check. 4 each test makes its own article through the API; comment text built from `Date.now()`; the 6 passing tests passed three stress runs. 5 plan matches the app; two wrong statements (it said the API client has no comment helper when it has `addComment` and `listComments`; the generator header names a plan file that does not exist). 6 no `fixme`, no skip, nothing loosened. 7 used the repo's fixtures, `buildArticle` and `ArticlePage`; added nothing to the page object.
- Mutation check: of the 6 tests that passed on the unpatched app, against `comment-not-saved.patch` 4 failed (post and persist, delete, dismiss, as they should) and 2 passed (empty state, empty comment: not affected by the patch); against `comment-delete-noop.patch` the delete test failed and the rest passed.
- Stress (6 workers, shuffled, each test 5 times, the 6 passing tests only): 30 passed, 30 passed, 30 passed.
- What I changed by hand: nothing in the run; see the end for what changed when tests were kept.
- What it got wrong: two of the 8 tests failed on the unpatched app on locator strictness. "Logged-in user can post a comment" used `locator('div').filter(...).last()` and found no author link in it; "Other users' comments have no delete button" matched the author link twice (strict-mode error). No generator ran its test.
- Kept or discarded: the other 6 as a source for the two kept tests; the two failing tests discarded.

### Run 2: planner and generator on article comments (guided), 2026-11-03

- Playwright: 1.64.1. Run in Claude Code.
- Prompt (verbatim): the run 1 prompt plus "Follow docs/agents/guidance.md." (also given to every generator call).
- Produced: a plan of 7 cases (78 lines) and one spec file of 7 tests (171 lines).
- Checklist: 1 pass. 2 no CSS workaround of its own: role and placeholder locators plus the page object's `comment()`; no `.first()` or `.last()`. 3 see mutation check. 4 own article per test; comment text built from `buildArticle().body` (a builder, with a comment saying there is no comment builder); stress runs: 30 passed and 5 failed, three times, the 5 being always the dismiss test. 5 plan matches the app; it cited "guidance rule 13" and "rule 14" (the file has bullets, not numbered rules); it did not try the empty comment case. 6 nothing hidden. 7 used `authedTest`, `workerUser`, `otherUser`, `api`, `buildArticle` and `ArticlePage`; added nothing to the page object (the planner suggested helpers; nobody applied them).
- Mutation check: of the 6 tests that passed on the unpatched app, against `comment-not-saved.patch` 5 failed and 1 passed (empty comment); against `comment-delete-noop.patch` the 2 tests that delete a comment failed and the other 4 passed.
- Stress: three runs of 35 test executions each, 30 passed and 5 failed each time (the dismiss test).
- What I changed by hand: nothing in the run.
- What it got wrong: "dismissing the delete confirmation keeps the comment" hangs: it waits for the dialog event after awaiting the click, and the click does not return while the dialog is open, so the test times out after 35 seconds on the unpatched app. No generator ran its test (no test runner in their tool set).
- Kept or discarded: as a source for the two kept tests; the dismiss test discarded as written.

### Run 3: the healer on a legitimate UI change, 2026-11-03

- Playwright: 1.64.1. The test: "a posted comment persists after reload", taken verbatim from run 2. App patched with `comment-ui-renamed.patch` (the button text `Post Comment` becomes `Send`).
- Prompt (verbatim): "The test 'a posted comment persists after reload' is failing. Use the playwright-test-healer agent to fix it."
- Before: failed with a 30 second timeout on `getByRole('button', { name: 'Post Comment' })`.
- Produced: one changed line, `'Post Comment'` to `'Send'`. Its message gave the correct cause from the page snapshot, and said it re-ran only that spec.
- Checklist 6: no `fixme`, no skip, no assertion or wait changed. Checked by me: the healed test passes against the renamed app and fails against the original app (30 second timeout on `'Send'`), so it follows the UI and nothing was loosened.
- What it got wrong: nothing found. One test, one change: this says nothing about larger UI changes.

### Run 4: the healer on a defect, 2026-11-03

- Same test, same prompt. App patched with `comment-not-saved.patch` (the backend answers 201 but deletes the comment).
- Before: the original test failed at the assertion that the comment card is visible.
- Produced: no locator or assertion changed. It added `test.fixme(true, 'SUT does not persist comments (createComment destroys the record)')` and a comment, so the test is skipped (1 skipped). Its message named an app defect and gave network evidence (POST returned 201, the next GET returned an empty list).
- Checklist 6: honest diagnosis, hidden defect. It did not loosen or delete the assertion, but the suite goes green on a skipped test. Its own instructions tell it to mark `test.fixme()` and not to ask questions.
- Flaw in this run: the patch file was in the checkout and its message says it read it. The network evidence did not need the file, but the named cause (`comment.destroy()`) came from it.

### Run 4b: run 4 again with the patch file hidden, 2026-11-03

- Why: to separate what the healer finds from what it was handed. This is one run beyond the planned four, added because run 4's set-up was flawed.
- Set-up: the app was built with the patch, then the patch file was removed from the checkout before the agent started (checked: no patch file readable, nothing matching `comment.destroy`).
- Produced: the same behaviour. It found from the network that POST returned 201 and GET returned an empty list (also with a direct `fetch` from the page), changed no locator or assertion, and switched the test to `test.fixme`.
- What it got wrong: it offered a cause, labelled "not confirmed": that the commenter is also the article's author. That is wrong (the same test passes on the unpatched app), and the comment it left in the test names that cause.
- Conclusion for runs 4 and 4b: the healer finds that something is wrong with the app without any help, but not the cause; in run 4 the cause came from the patch file.

## What entered the suite, and what did not

Two tests entered, in `tests/e2e/comments.spec.ts` (pull request with the review of each change): "a posted comment is shown and is still there after a reload" and "a user can delete their own comment". Hand changes compared with the agents' tests:

- The locators and actions moved into `ArticlePage` (`commentBox`, `postComment`, `deleteComment`).
- The delete helper registers `page.once('dialog', ...)` before the click, which is what the agents' dismiss test got wrong.
- `buildComment()` added to the builders (run 1 used `Date.now()`, run 2 reused the article builder).
- Run 2's "post" and "persist" cases merged into one, and each test now also checks the result through the API.

Checked: lint and type-check pass, both tests pass on the unpatched app, three stress runs gave 10 passed each, both fail under `comment-not-saved.patch`, and only the delete test fails under `comment-delete-noop.patch`.

Not kept: the empty-state test, the multiple-comments test, the empty-comment test, the dismiss test, the other-user test and the delete-one-of-two test. They are cheap to add later from the run branches; each would need the same page-object work. No healer output was kept: both `fixme` results break the suite's rule.

## What this shows, and what it does not

- Showed: the agents can explore a real app and plan it accurately; the guided run produced a cleaner suite than the bare run; the healer follows a legitimate UI change correctly; the healer reports a defect honestly but hides it with `test.fixme`.
- Did not show: anything about other features, bigger changes, other models, or how often. One feature, one reviewer, one run each (two for the defect case). The numbers above are counts from those runs, not rates.
- Needed from a human every time: running the generated tests (the generators cannot), reading each locator, and mutation checks (a generated test that never fails would pass review by eye).

## Open points

- The healer's `test.fixme` against this suite's rule. A repo that wants to use the healer would need to tell it to use `test.fail()` and keep the assertion, or review every `fixme` it writes.

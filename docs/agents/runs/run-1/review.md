# Run 1 review (by the human-directed reviewer, not by the agents)

Reviewed the branch as pushed (commit 66aa8df), against the pinned app, Playwright 1.64.1, Chromium.

1. Lint and type-check: `npm run lint` and `npx tsc --noEmit` pass with no findings.
2. Locators: mostly role and placeholder based (`getByRole('textbox', { name: 'Write a comment...' })`, `getByRole('button', { name: 'Post Comment' })`). Three CSS workarounds: `.card` filtered by text (matches the suite's own `ArticlePage.comment()`), `page.locator('div').filter(...).last()` in test 1.2 (fragile: it picked an element with no author link), and an unnamed icon button reached as `commentCard.getByRole('button')`. The CSS use is explained in comments for the card.
3. Assertions can fail: as generated, 6 of 8 pass and 2 fail on the unpatched app (see below), so those two do not count. With `comment-not-saved.patch`, the post, persist, delete and dismiss tests fail. With `comment-delete-noop.patch`, "User can delete their own comment" fails. "Empty article shows no-comments message" and "Empty comment is not posted" pass under both patches, as they should (they check things the patches do not change).
4. Isolation: each test creates its own article through `api.createArticle`; the unique text is built from `Date.now()` (the suite's builders are not used for comment text). The 6 passing tests passed three stress runs (6 workers, shuffled, each repeated 5 times): 30 passed, 30 passed, 30 passed. The two failing tests were excluded from the stress runs.
5. Plan versus app: the plan matched the running app on form text, empty-state text, the confirm dialog text and the icon-only delete button. Invented or wrong statements: the planner said `src/api/client.ts` has no comment helper (it has `addComment` and `listComments`); the generator header comment names `specs/plan.md`, which does not exist; the plan says the textbox clears after posting and the planner said it had not tried it.
6. Defect hiding: none. No `test.fixme`, no `test.skip`, no loosened assertion, no removed expected-failure marker.
7. Conventions: used `authedTest`, `workerUser`, `otherUser`, `api`, `buildArticle` and `ArticlePage` (the repo's own fixtures and page object). Did not add anything to the page object; locators live in the tests.

Two of the eight generated tests fail on the unpatched app, both on locator strictness. No generator ran its test.
- "Logged-in user can post a comment": the `div` filter with `.last()` picks an element that contains no author link, so the link assertion finds nothing.
- "Other users' comments have no delete button": the author link matches two elements (an avatar link and a name link), so the strict-mode check fails.

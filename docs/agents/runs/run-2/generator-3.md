Test: posting an empty comment does not add a comment

I added the test 'posting an empty comment does not add a comment' to /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, but I did not run it as a Playwright test. This session had no shell, so `npx playwright test` was not available. That falls short of the guidance rule that a test must be run before hand-off, so please run `npx playwright test tests/agents/article-comments.spec.ts`.

What I did check by hand, in the live browser as the seeded logged-in user:
- I created an article through the API and opened it.
- I clicked 'Post Comment' with the textbox empty.
- 'There are no comments yet...' stayed visible.
- `GET /api/articles/<slug>/comments` returned `{"comments":[]}`.

The app does not add an empty comment, so there is no defect to report.

The test follows docs/agents/guidance.md.
- **Fixtures and data:** it uses `authedTest`, `api.createArticle` with `buildArticle()`, and the `ArticlePage` page object.
- **Locators:** I used role and text locators, with no `.first()`, no timeouts and no `force: true`.
- **Assertions:** they are web-first, plus `expect(await api.listComments(article.slug)).toEqual([])`. The API check runs once, right after the click and the on-screen check.

To add the test I rewrote the whole file with the write tool. The two existing tests in it are unchanged.

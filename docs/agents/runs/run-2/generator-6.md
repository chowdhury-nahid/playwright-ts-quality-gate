Test: another user's comment has no delete button

I added the test "another user's comment has no delete button" to /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, but I did not run it. guidance.md requires running it against the live app, and I had no way to do that. I had no Bash or test-runner tool, and I never exercised the app in a browser either. Please run `npx playwright test tests/agents/article-comments.spec.ts` before trusting it.

I also had no Edit tool, so I rewrote the whole file through generator_write_test. The four existing tests are copied unchanged, and the new one sits at the end of the same `test.describe('Article comments')`.

The new test:
- **Setup:** it uses `authedTest` with the `workerUser`, `otherUser`, `api` and `page` fixtures. workerUser creates the article through `api.createArticle(buildArticle())`. otherUser adds the comment through `api.addComment(otherUser.token, ...)`, with a unique body built the same way as in the other tests. Then it opens the article through `ArticlePage`.
- **Assertions:**
  - The `ArticlePage.heading` check passes first, so the page has loaded.
  - `articlePage.comment(body)` must be visible. It uses the existing `.card` filter, which the page object already documents.
  - `card.getByRole('button')` must have a count of 0, using web-first assertions. The sibling delete tests rely on the same locator, so I expect it to be correct.

I used no `.first()`, no timeouts and no CSS selectors of my own.

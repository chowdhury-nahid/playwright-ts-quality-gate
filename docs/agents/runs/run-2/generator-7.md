Test: deleting one comment leaves other comments intact

I added the test "deleting one comment leaves other comments intact" to the existing `describe('Article comments')` in /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts. I have not run it, which docs/agents/guidance.md requires. This session had no Bash tool, so I could not run `npx playwright test`. Please run it: `npx playwright test tests/agents/article-comments.spec.ts`.

The file already held five tests and my write tool replaces the whole file. I re-wrote the five existing tests unchanged and appended the new one.

The seed page did load against the running app at localhost:3001, but I did not step through the delete flow in the browser either.

What the test does:
- It creates an article with `api.createArticle(workerUser.token, buildArticle())`.
- It adds two comments through `api.addComment`. The bodies are unique strings built from `buildArticle().body`, with no `Date.now()`.
- It opens the article through `ArticlePage` and checks that both comment cards are visible.
- It registers a one-time dialog handler that accepts, then clicks the first card's only button. That button is the icon-only delete control, so I kept the same explanatory comment as the existing delete test.
- It asserts the first card is hidden and the second is still visible.
- It also polls `api.listComments` until the stored bodies equal just the second comment.

The locators are the same ones the existing delete test uses (`articlePage.comment(body)` and `getByRole('button')` inside the card), so I expect no strict-mode problems. That is unconfirmed until the test runs.

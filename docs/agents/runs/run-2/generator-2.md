Test: a posted comment persists after reload

I added the test "a posted comment persists after reload" to /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, inside the existing 'Article comments' describe. The spec file has not been run, because this session had no shell or test runner, so guidance.md's "run it before handing back" rule is not met. Please run `npx playwright test tests/agents/article-comments.spec.ts`.

What I did check: I ran the same flow by hand in the browser on the live app at localhost:3001. I created an article through the API, posted a comment in the UI, and reloaded. The comment text was still visible after the reload.

What the test does:
- It creates the article with `api.createArticle` and a `buildArticle()` builder.
- It posts a comment through the UI, with a unique body built from `buildArticle().body`.
- It calls `page.reload()`.
- It asserts with web-first expects that the article heading and `articlePage.comment(body)` (the comment card) are visible.
- It touches only data the test created, and it uses no `Date.now()`, no waits, no `force` and no `.first()`.

Two things to know:
- **Page object:** guidance.md says a locator used in more than one test belongs in a page object. The comment textbox and "Post Comment" button are now used by both tests but still sit inline in the spec file, because I had no edit tool and could only rewrite the spec. A follow-up could add `commentInput` and `postCommentButton` getters to `src/pages/article-page.ts` and use them in both tests.
- **Existing test:** I re-wrote the first test ("a logged-in user can post a comment on an article") unchanged.

Test: a logged-in user can post a comment on an article

I wrote the test at /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, but I did not run it, so it is unconfirmed. This session had no Bash tool and no way to start a Playwright run, so guidance rule 13 (run the test before handing it back) is not met. Please run `npx playwright test tests/agents/article-comments.spec.ts`.

What I did check, in the live browser:
- I created an article through the API (by fetch inside the page) and opened `/#/article/<slug>`.
- The page snapshot shows a textbox named "Write a comment..." and a button named "Post Comment". Both are unique, so the role locators should match one element each.
- I did not post a comment in the browser, so the post behaviour is not checked.

What the test does, following the plan:
1. It uses the `authedTest` fixtures (`page`, `api`, `workerUser`). It creates the article with `api.createArticle(workerUser.token, buildArticle())`, opens it with `ArticlePage.goto`, and asserts the heading, the textbox and the button are visible.
2. It fills a unique body and clicks Post Comment. It then asserts:
   - the comment card is visible, using `articlePage.comment(body)`;
   - the textbox has value `''`;
   - `api.listComments(slug)` contains exactly `[[body, workerUser.username]]`, checked with `expect.poll`.

Deviations from the guidance:
- **Inline locators:** the textbox and button locators are inline in the test, not in `ArticlePage`, because I had no file-editing tool. They are used by one test only, so this is acceptable, but you may want to move them into `ArticlePage` later.
- **Comment body:** `src/data/builders.ts` has no comment builder, so the body is `Comment ${buildArticle().body}`, which is unique and avoids `Date.now()`. A `buildComment` helper would be tidier.
- **Spec reference:** the header comment says `specs/plan.md`, which is a guess. I did not check that this file exists.

No app defects observed.

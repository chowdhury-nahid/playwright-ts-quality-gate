Test: a user can delete their own comment

I added the test "a user can delete their own comment" to /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, inside the existing 'Article comments' describe. I could NOT run the test file: I had no shell tool, only browser tools and the file writer. Guidance requires a run, so please run `npx playwright test tests/agents/article-comments.spec.ts` before accepting it.

What I did check, by hand in the live app (a separate comment, created through the UI): the delete icon button in the comment card works. Clicking it opens a confirm dialog with the message "Want to delete the comment?". After I accepted, the comment disappeared and "There are no comments yet..." showed. That manual check did not use the API calls the test uses, so `api.addComment` and `api.listComments` are also unrun.

How the test works:
- It creates the article with `api.createArticle` and the comment with `api.addComment`, using a unique body built from `buildArticle().body`. This follows the same pattern as the existing tests, since there is no comment builder.
- It opens the article and checks that the comment card and its delete button are visible.
- It registers a one-time dialog handler that records the message and accepts, then clicks the button.
- It asserts that the card is hidden and that the message is 'Want to delete the comment?'.
- It polls `api.listComments(slug)` until the body is no longer in the list.

Things to know:
- The delete button is icon-only (`<button><i class="ion-trash-a">`) with no accessible name. I located it as `articlePage.comment(body).getByRole('button')`, which matches the card's only button, and left a comment in the test saying why.
- I did not add a page-object method because only this one test uses the locator. I also had no tool to edit `src/pages/article-page.ts`.
- I rewrote the whole spec file with the file-writer tool. The three existing tests are unchanged.
- The seed test showed the app's home feed as "Articles not available" in the browser session. That is unrelated to this test.

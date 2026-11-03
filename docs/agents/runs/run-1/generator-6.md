I added the test 'User can delete their own comment' to /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, inside the existing 'Article comments' describe. I kept the other five tests in that file unchanged. I did not run the finished spec.

I did walk through the flow manually in the browser. After accepting the confirm dialog 'Want to delete the comment?', 'There are no comments yet...' was visible again.

- **Setup:** the test creates the article through the `api` fixture, as the other tests in the file do. In the manual walkthrough I made the article through the editor UI instead.
- **Dialog:** a one-time `page.once('dialog')` handler checks the message and accepts it.
- **Delete button:** the icon-only button has no accessible name. The recorded locator `getByRole('button').filter({hasText:/^$/})` was too broad, so the test uses `page.locator('.card').filter({hasText: commentText}).getByRole('button')`. The `.card` class is one I assumed from the existing 'Empty comment is not posted' test. I did not confirm it against the page.
- **Assertions:** the comment text is hidden, and 'There are no comments yet...' is visible.

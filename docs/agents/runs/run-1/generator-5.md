I added the test 'Empty comment is not posted' to the existing `describe('Article comments')` in /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts. I did not run it, and I did not exercise the empty-comment click in the browser. The existing four tests are unchanged.

The test creates an article through the API as `workerUser`, opens it, and checks the comment textbox is empty. It clicks 'Post Comment', then asserts two things:
- No `.card` containing a link to the worker user's username exists (count 0).
- 'There are no comments yet...' is still visible.

Things to know:
- The first write attempt with an absolute path was rejected by `generator_write_test` ("did not match any of the test dirs"). A path relative to the repo root, `tests/agents/article-comments.spec.ts`, worked.
- The file already held four tests, and this one is the fifth, which differs from the one-test-per-file rule in the instructions. I rewrote the whole file with the existing tests copied unchanged.
- The "no comment card" assertion relies on the `.card` CSS class and the author link inside it, because the app gives comment cards no role or label. A comment authored by someone else would not be matched, which is fine on a fresh article.

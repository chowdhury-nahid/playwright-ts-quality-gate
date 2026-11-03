I added the test "Multiple comments are all listed" to /home/user/playwright-ts-quality-gate/tests/agents/article-comments.spec.ts, inside the existing `Article comments` describe. I haven't run it, and I didn't walk through the steps in the live browser.

The seed page only showed the home feed, and the article setup uses an API fixture (`api.createArticle`) that the browser tools can't call. So I wrote the test from the locators and fixtures the two existing tests in that file already use.

What the test does:
- It creates an article through the API and opens it with `ArticlePage`.
- It posts two comments with different unique texts, `First unique comment <stamp>` and `Second unique comment <stamp>`.
- It checks that the first comment is visible before posting the second, then checks that both are visible.

The first attempt to write the file failed with an absolute path. The write tool only accepted the path relative to the repo (`tests/agents/article-comments.spec.ts`). The two existing tests in the file are unchanged.

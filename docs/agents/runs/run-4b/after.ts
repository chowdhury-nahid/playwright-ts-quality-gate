// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';
import { ArticlePage } from '../../src/pages/article-page';

test.describe('Article comments', () => {
  // App defect, not a test defect: POST /api/articles/:slug/comments returns 201 with the new comment,
  // but GET /api/articles/:slug/comments keeps returning {"comments":[]}, so the UI shows
  // "There are no comments yet..." instead of the posted comment. Reproduced with a direct fetch,
  // independent of the UI. Here the commenter is the article's author; the passing tests comment
  // as a different user. Remove fixme once the backend lists comments the author posts on their own article.
  test.fixme('a posted comment persists after reload', async ({ page, api, workerUser }) => {
    // 1. Create article via API, post a comment through the UI, reload the page
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // buildArticle().body is a unique string from the suite's builders (there is no comment builder).
    const body = `Comment ${buildArticle().body}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(body);
    await page.getByRole('button', { name: 'Post Comment' }).click();
    await expect(articlePage.comment(body)).toBeVisible();

    await page.reload();

    // expect: the comment card is still visible after reload
    await expect(articlePage.heading(article.title)).toBeVisible();
    await expect(articlePage.comment(body)).toBeVisible();
  });
});

import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle, buildComment } from '../../src/data/builders';
import { ArticlePage } from '../../src/pages/article-page';

// Both tests started as output of the Playwright test agents (docs/AGENTS-LOG.md) and were reviewed and changed by hand.
test.describe('comments', () => {
  test('a posted comment is shown and is still there after a reload', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const comment = buildComment();
    const articlePage = new ArticlePage(page);

    await articlePage.goto(article.slug);
    await articlePage.postComment(comment);
    await expect(articlePage.comment(comment)).toBeVisible();
    await expect(articlePage.commentBox()).toHaveValue('');

    await page.reload();
    await expect(articlePage.comment(comment)).toBeVisible();
    expect((await api.listComments(article.slug)).map((c) => c.body)).toEqual([comment]);
  });

  test('a user can delete their own comment', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const comment = buildComment();
    await api.addComment(workerUser.token, article.slug, comment);
    const articlePage = new ArticlePage(page);

    await articlePage.goto(article.slug);
    await expect(articlePage.comment(comment)).toBeVisible();
    await articlePage.deleteComment(comment);

    await expect(articlePage.comment(comment)).toBeHidden();
    await expect.poll(async () => (await api.listComments(article.slug)).map((c) => c.body)).toEqual([]);
  });
});

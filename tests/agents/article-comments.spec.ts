// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';
import { ArticlePage } from '../../src/pages/article-page';

test.describe('Article comments', () => {
  test('Empty article shows no-comments message', async ({ page, api, workerUser }) => {
    // 1. Create a new article via API and open /#/article/<slug>
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);

    await expect(articlePage.heading(article.title)).toBeVisible();
    await expect(page.getByText('There are no comments yet...')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a comment...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible();
  });

  test('Logged-in user can post a comment', async ({ page, api, workerUser }) => {
    // 1. Open a fresh article, fill 'Write a comment...' with a unique text, click 'Post Comment'
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    const commentText = `Unique comment ${Date.now()}`;
    const commentBox = page.getByRole('textbox', { name: 'Write a comment...' });
    await commentBox.fill(commentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // expect: comment text appears in a comment card with the author's username
    const commentCard = page.locator('div').filter({ hasText: commentText }).last();
    await expect(page.getByText(commentText)).toBeVisible();
    await expect(commentCard.getByRole('link', { name: workerUser.username })).toBeVisible();

    // expect: 'There are no comments yet...' disappears
    await expect(page.getByText('There are no comments yet...')).toBeHidden();

    // expect: the comment textbox is cleared
    await expect(commentBox).toHaveValue('');
  });

  test('Multiple comments are all listed', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // 1. Post two comments with different unique texts
    const stamp = Date.now();
    const firstComment = `First unique comment ${stamp}`;
    const secondComment = `Second unique comment ${stamp}`;
    const commentBox = page.getByRole('textbox', { name: 'Write a comment...' });
    const postButton = page.getByRole('button', { name: 'Post Comment' });

    await commentBox.fill(firstComment);
    await postButton.click();
    await expect(page.getByText(firstComment)).toBeVisible();

    await commentBox.fill(secondComment);
    await postButton.click();

    // expect: both comments are visible on the page
    await expect(page.getByText(firstComment)).toBeVisible();
    await expect(page.getByText(secondComment)).toBeVisible();
  });

  test('Posted comment persists after reload', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // 1. Post a comment, then reload the page
    const commentText = `Persistent comment ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();
    await expect(page.getByText(commentText)).toBeVisible();

    await page.reload();

    // expect: The comment is still visible
    await expect(articlePage.heading(article.title)).toBeVisible();
    await expect(page.getByText(commentText)).toBeVisible();
  });

  test('Empty comment is not posted', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // 1. On a fresh article click 'Post Comment' with an empty textbox
    await expect(page.getByRole('textbox', { name: 'Write a comment...' })).toHaveValue('');
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // expect: No comment card is added
    await expect(page.locator('.card').filter({ has: page.getByRole('link', { name: workerUser.username }) })).toHaveCount(0);

    // expect: 'There are no comments yet...' remains visible
    await expect(page.getByText('There are no comments yet...')).toBeVisible();
  });

  test('User can delete their own comment', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // 1. Post a comment, click its icon-only delete button, accept the confirm dialog 'Want to delete the comment?'
    const commentText = `Comment to delete ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();
    await expect(page.getByText(commentText)).toBeVisible();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Want to delete the comment?');
      await dialog.accept();
    });
    // The delete button has no accessible name (icon only), so scope it to the comment card
    const commentCard = page.locator('.card').filter({ hasText: commentText });
    await commentCard.getByRole('button').click();

    // expect: The comment disappears
    await expect(page.getByText(commentText)).toBeHidden();

    // expect: 'There are no comments yet...' is shown again
    await expect(page.getByText('There are no comments yet...')).toBeVisible();
  });

  test('Dismissing the delete confirmation keeps the comment', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // 1. Post a comment, click its delete button, dismiss the confirm dialog
    const commentText = `Comment to keep ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill(commentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();
    await expect(page.getByText(commentText)).toBeVisible();

    let dialogHandled = false;
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Want to delete the comment?');
      dialogHandled = true;
      await dialog.dismiss();
    });
    // The delete button has no accessible name (icon only), so scope it to the comment card
    const commentCard = page.locator('.card').filter({ hasText: commentText });
    await commentCard.getByRole('button').click();

    // expect: The comment remains visible
    await expect.poll(() => dialogHandled).toBe(true);
    await expect(page.getByText(commentText)).toBeVisible();
    await expect(page.getByText('There are no comments yet...')).toBeHidden();
  });

  test("Other users' comments have no delete button", async ({ page, api, workerUser, otherUser }) => {
    // 1. Create a comment on an article via API as a second user, then open the article as the worker user
    const article = await api.createArticle(workerUser.token, buildArticle());
    const commentText = `Comment by another user ${Date.now()}`;
    await api.addComment(otherUser.token, article.slug, commentText);

    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // expect: The comment is visible
    await expect(page.getByText(commentText)).toBeVisible();

    // expect: The comment card has no delete button
    const commentCard = page.locator('.card').filter({ hasText: commentText });
    await expect(commentCard.getByRole('link', { name: otherUser.username })).toBeVisible();
    await expect(commentCard.getByRole('button')).toHaveCount(0);
  });
});

// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';
import { ArticlePage } from '../../src/pages/article-page';

test.describe('Article comments', () => {
  test('a logged-in user can post a comment on an article', async ({ page, api, workerUser }) => {
    // 1. Create an article via api.createArticle as workerUser; open /#/article/<slug>
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();
    const commentInput = page.getByRole('textbox', { name: 'Write a comment...' });
    const postButton = page.getByRole('button', { name: 'Post Comment' });
    await expect(commentInput).toBeVisible();
    await expect(postButton).toBeVisible();

    // 2. Fill the textbox with a unique comment body and click 'Post Comment'
    // buildArticle().body is a unique string from the suite's builders (there is no comment builder).
    const body = `Comment ${buildArticle().body}`;
    await commentInput.fill(body);
    await postButton.click();

    await expect(articlePage.comment(body)).toBeVisible();
    await expect(commentInput).toHaveValue('');
    await expect
      .poll(async () => (await api.listComments(article.slug)).map((c) => [c.body, c.author.username]))
      .toEqual([[body, workerUser.username]]);
  });

  test('a posted comment persists after reload', async ({ page, api, workerUser }) => {
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

  test('posting an empty comment does not add a comment', async ({ page, api, workerUser }) => {
    // 1. Create article via API, open it, click 'Post Comment' with empty textbox (negative)
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a comment...' })).toHaveValue('');
    await expect(page.getByText('There are no comments yet...')).toBeVisible();

    await page.getByRole('button', { name: 'Post Comment' }).click();

    // expect: the empty state remains and no comment was stored
    await expect(page.getByText('There are no comments yet...')).toBeVisible();
    expect(await api.listComments(article.slug)).toEqual([]);
  });

  test('a user can delete their own comment', async ({ page, api, workerUser }) => {
    // 1. Create article and a comment by workerUser via api.addComment; open the article
    const article = await api.createArticle(workerUser.token, buildArticle());
    // buildArticle().body is a unique string from the suite's builders (there is no comment builder).
    const body = `Comment ${buildArticle().body}`;
    await api.addComment(workerUser.token, article.slug, body);
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();
    const card = articlePage.comment(body);
    // The delete control is an icon-only button without an accessible name; it is the card's only button.
    const deleteButton = card.getByRole('button');
    await expect(card).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // 2. Register dialog handler that accepts, click the delete button in the comment card
    let confirmMessage = '';
    page.once('dialog', (dialog) => {
      confirmMessage = dialog.message();
      void dialog.accept();
    });
    await deleteButton.click();

    await expect(card).toBeHidden();
    expect(confirmMessage).toBe('Want to delete the comment?');
    await expect
      .poll(async () => (await api.listComments(article.slug)).map((c) => c.body))
      .not.toContain(body);
  });

  test('dismissing the delete confirmation keeps the comment', async ({ page, api, workerUser }) => {
    // 1. Same setup as delete (create article and a comment by workerUser via api.addComment; open the article); dismiss the confirm dialog explicitly
    const article = await api.createArticle(workerUser.token, buildArticle());
    // buildArticle().body is a unique string from the suite's builders (there is no comment builder).
    const body = `Comment ${buildArticle().body}`;
    await api.addComment(workerUser.token, article.slug, body);
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();
    const card = articlePage.comment(body);
    // The delete control is an icon-only button without an accessible name; it is the card's only button.
    const deleteButton = card.getByRole('button');
    await expect(card).toBeVisible();
    await expect(deleteButton).toBeVisible();

    const dialogPromise = page.waitForEvent('dialog');
    await deleteButton.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Want to delete the comment?');
    await dialog.dismiss();

    // expect: the comment card remains visible and the comment still exists via API
    await expect(card).toBeVisible();
    expect((await api.listComments(article.slug)).map((c) => c.body)).toContain(body);
  });

  test("another user's comment has no delete button", async ({ page, api, workerUser, otherUser }) => {
    // 1. Create article as workerUser; otherUser adds a comment via api.addComment; open the article as workerUser
    const article = await api.createArticle(workerUser.token, buildArticle());
    // buildArticle().body is a unique string from the suite's builders (there is no comment builder).
    const body = `Comment ${buildArticle().body}`;
    await api.addComment(otherUser.token, article.slug, body);
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    // expect: the other user's comment card is visible and contains no button
    const card = articlePage.comment(body);
    await expect(card).toBeVisible();
    await expect(card.getByRole('button')).toHaveCount(0);
  });

  test('deleting one comment leaves other comments intact', async ({ page, api, workerUser }) => {
    // 1. Create article, add two comments by workerUser via API, open article, delete the first through the UI
    const article = await api.createArticle(workerUser.token, buildArticle());
    // buildArticle().body is a unique string from the suite's builders (there is no comment builder).
    const firstBody = `First comment ${buildArticle().body}`;
    const secondBody = `Second comment ${buildArticle().body}`;
    await api.addComment(workerUser.token, article.slug, firstBody);
    await api.addComment(workerUser.token, article.slug, secondBody);
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();
    const firstCard = articlePage.comment(firstBody);
    const secondCard = articlePage.comment(secondBody);
    // The delete control is an icon-only button without an accessible name; it is the card's only button.
    const deleteButton = firstCard.getByRole('button');
    await expect(firstCard).toBeVisible();
    await expect(secondCard).toBeVisible();

    page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await deleteButton.click();

    // expect: the deleted comment is gone and the second is still visible
    await expect(firstCard).toBeHidden();
    await expect(secondCard).toBeVisible();
    await expect
      .poll(async () => (await api.listComments(article.slug)).map((c) => c.body))
      .toEqual([secondBody]);
  });
});

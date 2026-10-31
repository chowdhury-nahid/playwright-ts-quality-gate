import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';
import { ArticlePage } from '../../src/pages/article-page';
import { HomePage } from '../../src/pages/home-page';
import { ProfilePage } from '../../src/pages/profile-page';

test.describe('API sets up the state, the UI verifies it', () => {
  test('a comment added through the API is shown on the article page', async ({
    page,
    api,
    workerUser,
    published,
  }) => {
    const { article } = published;
    const text = `comment on ${article.slug}`;
    await api.addComment(workerUser.token, article.slug, text);
    const articlePage = new ArticlePage(page);

    await articlePage.goto(article.slug);

    await expect(articlePage.heading(article.title)).toBeVisible();
    await expect(articlePage.comment(text)).toBeVisible();
  });

  test('an author followed through the API appears in Your Feed, and disappears when unfollowed', async ({
    page,
    api,
    workerUser,
    published,
  }) => {
    const { author, article } = published;
    await api.follow(workerUser.token, author.username);
    const home = new HomePage(page);

    await home.goto();
    await expect(home.articleCard(article.title)).toBeVisible();

    await api.unfollow(workerUser.token, author.username);
    await page.reload();
    await expect(home.noArticlesMessage).toBeVisible();
    await expect(home.articleCard(article.title)).toBeHidden();
  });

  test('an article favorited through the API is listed under the profile favorites', async ({
    page,
    api,
    workerUser,
    published,
  }) => {
    const { article } = published;
    await api.favorite(workerUser.token, article.slug);
    const profile = new ProfilePage(page);

    await profile.gotoFavorites(workerUser.username);

    await expect(profile.articles.card(article.title)).toBeVisible();
  });

  test('deleting an article in the UI removes it from the API', async ({ page, api, workerUser }) => {
    const article = await api.createArticle(workerUser.token, buildArticle());
    const articlePage = new ArticlePage(page);
    await articlePage.goto(article.slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    await articlePage.deleteArticle();

    await expect(page).toHaveURL(/#\/$/);
    await expect
      .poll(async () => (await api.send('GET', `/api/articles/${article.slug}`)).status())
      .toBe(404);
  });
});

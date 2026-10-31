import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';
import { Navbar } from '../../src/components/navbar';
import { ArticlePage } from '../../src/pages/article-page';
import { EditorPage } from '../../src/pages/editor-page';
import { HomePage } from '../../src/pages/home-page';

test.describe('articles', () => {
  test('a logged-in user can publish an article @smoke', async ({ page }) => {
    const article = buildArticle();
    const editor = new EditorPage(page);
    const articlePage = new ArticlePage(page);

    await editor.goto();
    await editor.publish(article);

    await expect(page).toHaveURL(/#\/article\//);
    await expect(articlePage.heading(article.title)).toBeVisible();
  });

  test('a published article appears in the global feed @smoke', async ({ page, api, workerUser }) => {
    const article = buildArticle();
    await api.createArticle(workerUser.token, article);
    const home = new HomePage(page);

    await home.goto();
    await home.openGlobalFeed();

    await expect(home.articleCard(article.title)).toBeVisible();
  });

  test('favoriting an article from the feed increments its count', async ({ page, api, workerUser }) => {
    const article = buildArticle();
    await api.createArticle(workerUser.token, article);
    const home = new HomePage(page);

    await home.goto();
    await home.openGlobalFeed();
    await expect(home.favoriteButton(article.title)).toContainText('0');
    await home.favoriteButton(article.title).click();

    await expect(home.favoriteButton(article.title)).toContainText('1');
  });

  test('a logged-in user can log out @smoke', async ({ page, workerUser }) => {
    const navbar = new Navbar(page);
    const home = new HomePage(page);

    await home.goto();
    await navbar.logout(workerUser.username);

    await expect(navbar.loginLink).toBeVisible();
    await expect(navbar.newArticleLink).toBeHidden();
  });
});

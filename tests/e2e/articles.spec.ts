import { authedTest as test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';
import { Navbar } from '../../src/components/navbar';
import { ArticlePage } from '../../src/pages/article-page';
import { EditorPage } from '../../src/pages/editor-page';
import { HomePage } from '../../src/pages/home-page';
import { ProfilePage } from '../../src/pages/profile-page';

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

  // These two tests read the author's own profile, not the global feed. The global feed is a shared list of the
  // newest 3 articles from everyone (docs/FINDINGS.md F1), so a concurrent test can push an article off the page.
  // See docs/decisions/0005-tests-do-not-read-shared-lists.md.
  test('a published article appears on its author\'s profile @smoke', async ({ page, api, workerUser }) => {
    const article = buildArticle();
    await api.createArticle(workerUser.token, article);
    const profile = new ProfilePage(page);

    await profile.gotoArticles(workerUser.username);

    await expect(profile.articles.card(article.title)).toBeVisible();
  });

  test('favoriting an article from a list increments its count', async ({ page, api, workerUser }) => {
    const article = buildArticle();
    await api.createArticle(workerUser.token, article);
    const profile = new ProfilePage(page);

    await profile.gotoArticles(workerUser.username);
    await expect(profile.articles.favoriteButton(article.title)).toContainText('0');
    await profile.articles.favoriteButton(article.title).click();

    await expect(profile.articles.favoriteButton(article.title)).toContainText('1');
  });

  // The page's structure is checked as an accessibility tree (toMatchAriaSnapshot), not as separate locators:
  // the heading, the body, the owner's buttons and the comment form must all be there, in this order.
  // The template was written from the real tree (page.ariaSnapshot()); the date is the only part matched by pattern.
  test('an article page keeps its structure @smoke', async ({ page, api, workerUser }) => {
    const article = buildArticle();
    const { slug } = await api.createArticle(workerUser.token, article);
    const articlePage = new ArticlePage(page);

    await articlePage.goto(slug);
    await expect(articlePage.heading(article.title)).toBeVisible();

    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - heading "${article.title}" [level=1]
      - link "${workerUser.username}"
      - text: /\\w+ \\d{1,2}, \\d{4}/
      - button "Delete Article"
      - button "Edit Article"
      - paragraph: ${article.body}
      - textbox "Write a comment..."
      - button "Post Comment"
      - text: There are no comments yet...
    `);
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

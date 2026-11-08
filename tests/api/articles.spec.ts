import { test, expect } from '@playwright/test';
import { ConduitApi } from '../../src/api/client';
import { buildArticle, buildUser } from '../../src/data/builders';

test.describe('articles API', () => {
  test('an article created by a user appears in that author\'s article list', async ({ request }) => {
    const api = new ConduitApi(request);
    const author = await api.register(buildUser());
    const input = buildArticle();

    const created = await api.createArticle(author.token, input);

    expect(created.title).toBe(input.title);
    // Polled, not read once. The app has been seen to answer a create before the new article is in its own author's
    // list (finding F5). This is the same assertion, retried until the app agrees; it still fails if the article
    // never appears, so a real defect is not hidden by the wait.
    await expect
      .poll(async () => (await api.searchArticles({ author: author.username })).articles.map((a) => a.slug))
      .toContain(created.slug);
  });
});

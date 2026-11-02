import { test, expect } from '@playwright/test';
import { ConduitApi } from '../../src/api/client';
import { buildArticle, buildUser } from '../../src/data/builders';

test.describe('articles API', () => {
  test('an article created by a user appears in that author\'s article list', async ({ request }) => {
    const api = new ConduitApi(request);
    const author = await api.register(buildUser());
    const input = buildArticle();

    const created = await api.createArticle(author.token, input);
    const { articles } = await api.searchArticles({ author: author.username });

    expect(created.title).toBe(input.title);
    expect(articles.map((a) => a.slug)).toContain(created.slug);
  });
});

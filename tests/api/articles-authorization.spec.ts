import { test, expect } from '../../src/fixtures';
import { buildArticle } from '../../src/data/builders';

test.describe('article authorization and validation', () => {
  test('creating an article without a token is rejected', async ({ api }) => {
    const res = await api.send('POST', '/api/articles', { data: { article: buildArticle() } });

    expect(res.status()).toBe(401);
  });

  test('an article without a title is rejected', async ({ api, otherUser }) => {
    const res = await api.send('POST', '/api/articles', {
      token: otherUser.token,
      data: { article: { description: 'no title', body: 'body', tagList: [] } },
    });

    expect(res.status()).toBe(422);
  });

  test('only the author can update an article', async ({ api, published, otherUser }) => {
    const { author, article } = published;

    const attempt = await api.send('PUT', `/api/articles/${article.slug}`, {
      token: otherUser.token,
      data: { article: { body: 'hijacked' } },
    });
    const updated = await api.updateArticle(author.token, article.slug, { body: 'edited by the author' });

    expect(attempt.status()).toBe(403);
    expect(updated.body).toBe('edited by the author');
  });

  test('only the author can delete an article', async ({ api, published, otherUser }) => {
    const { author, article } = published;

    const attempt = await api.send('DELETE', `/api/articles/${article.slug}`, { token: otherUser.token });
    await api.deleteArticle(author.token, article.slug);
    const afterDelete = await api.send('GET', `/api/articles/${article.slug}`);

    expect(attempt.status()).toBe(403);
    expect(afterDelete.status()).toBe(404);
  });
});

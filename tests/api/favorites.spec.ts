import { test, expect } from '../../src/fixtures';

test.describe('favorites', () => {
  test('favoriting counts once, repeating it changes nothing, and unfavoriting reverses it', async ({
    api,
    published,
    otherUser,
  }) => {
    const { slug } = published.article;

    const first = await api.favorite(otherUser.token, slug);
    const repeated = await api.favorite(otherUser.token, slug);
    const reversed = await api.unfavorite(otherUser.token, slug);

    expect(first.favoritesCount).toBe(1);
    expect(first.favorited).toBe(true);
    expect(repeated.favoritesCount).toBe(1);
    expect(reversed.favoritesCount).toBe(0);
    expect(reversed.favorited).toBe(false);
  });

  test('favoriting without a token is rejected', async ({ api, published }) => {
    const res = await api.send('POST', `/api/articles/${published.article.slug}/favorite`);

    expect(res.status()).toBe(401);
  });
});

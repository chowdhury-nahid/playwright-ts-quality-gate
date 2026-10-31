import { test, expect } from '../../src/fixtures';
import { buildArticle, buildUser } from '../../src/data/builders';

// Each test asserts the CORRECT behaviour and is expected to fail while the app has the defect.
// Details and reproduction steps: docs/FINDINGS.md.
test.describe('known app defects (expected to fail until the app is fixed)', () => {
  test.fail('F1: the article list returns up to 20 articles by default', async ({ api, otherUser }) => {
    for (let i = 0; i < 5; i++) {
      await api.createArticle(otherUser.token, buildArticle());
    }

    const { articles } = await api.searchArticles({ author: otherUser.username });

    expect(articles).toHaveLength(5);
  });

  test.fail('F2: offset skips that many articles', async ({ api, otherUser }) => {
    for (let i = 0; i < 4; i++) {
      await api.createArticle(otherUser.token, buildArticle());
    }

    const all = (await api.searchArticles({ author: otherUser.username, limit: 10 })).articles.map((a) => a.slug);
    const skipped = (await api.searchArticles({ author: otherUser.username, limit: 2, offset: 1 })).articles.map(
      (a) => a.slug,
    );

    expect(skipped).toEqual(all.slice(1, 3));
  });

  test.fail('F3: registering a username that is already taken is rejected', async ({ api, otherUser }) => {
    const res = await api.send('POST', '/api/users', {
      data: { user: buildUser({ username: otherUser.username }) },
    });

    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test.fail('F4: updating the profile without a password does not crash the server', async ({ api, otherUser }) => {
    const res = await api.send('PUT', '/api/user', {
      token: otherUser.token,
      data: { user: { bio: 'a short bio' } },
    });

    expect(res.status()).toBeLessThan(500);
  });
});

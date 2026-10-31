import { test, expect } from '../../src/fixtures';
import { buildArticle, buildTag } from '../../src/data/builders';

test.describe('article list filters and paging', () => {
  test('filtering by tag and by author returns only the matching articles', async ({ api, otherUser }) => {
    const tag = buildTag();
    const tagged = await api.createArticle(otherUser.token, buildArticle({ tagList: [tag] }));
    const untagged = await api.createArticle(otherUser.token, buildArticle({ tagList: [] }));

    const byTag = await api.searchArticles({ tag });
    const byAuthor = await api.searchArticles({ author: otherUser.username, limit: 10 });
    const knownTags = await api.tags();

    expect(byTag.articles.map((a) => a.slug)).toEqual([tagged.slug]);
    expect(byAuthor.articles.map((a) => a.slug).sort()).toEqual([tagged.slug, untagged.slug].sort());
    expect(knownTags).toContain(tag);
  });

  test('filtering by favorited returns what that user favorited', async ({ api, published, otherUser }) => {
    await api.favorite(otherUser.token, published.article.slug);

    const result = await api.searchArticles({ favorited: otherUser.username });

    expect(result.articles.map((a) => a.slug)).toEqual([published.article.slug]);
  });

  test('an explicit limit is respected and the total count is the full count', async ({ api, otherUser }) => {
    for (let i = 0; i < 3; i++) {
      await api.createArticle(otherUser.token, buildArticle());
    }

    const page = await api.searchArticles({ author: otherUser.username, limit: 2 });

    expect(page.articles).toHaveLength(2);
    expect(page.articlesCount).toBe(3);
  });
});

import { test, expect } from '../../src/fixtures';

test.describe('comments', () => {
  test('a comment can be added and appears in the article comments', async ({ api, published, otherUser }) => {
    const { slug } = published.article;

    const comment = await api.addComment(otherUser.token, slug, 'a useful remark');
    const comments = await api.listComments(slug);

    expect(comment.author.username).toBe(otherUser.username);
    expect(comments.map((c) => c.id)).toContain(comment.id);
  });

  test('only the comment author can delete a comment, even if they do not own the article', async ({
    api,
    published,
    otherUser,
  }) => {
    const { slug } = published.article;
    const comment = await api.addComment(otherUser.token, slug, 'remove me');

    const byArticleAuthor = await api.send('DELETE', `/api/articles/${slug}/comments/${comment.id}`, {
      token: published.author.token,
    });
    const byCommentAuthor = await api.send('DELETE', `/api/articles/${slug}/comments/${comment.id}`, {
      token: otherUser.token,
    });
    const remaining = await api.listComments(slug);

    expect(byArticleAuthor.status()).toBe(403);
    expect(byCommentAuthor.status()).toBe(200);
    expect(remaining.map((c) => c.id)).not.toContain(comment.id);
  });
});

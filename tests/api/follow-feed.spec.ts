import { test, expect } from '../../src/fixtures';

test.describe('following and the feed', () => {
  test('following puts the author in the feed and unfollowing takes them out', async ({
    api,
    published,
    otherUser,
  }) => {
    const { author, article } = published;

    const followed = await api.follow(otherUser.token, author.username);
    const feedWhileFollowing = await api.feed(otherUser.token);
    const unfollowed = await api.unfollow(otherUser.token, author.username);
    const feedAfter = await api.feed(otherUser.token);

    expect(followed.following).toBe(true);
    expect(followed.followersCount).toBe(1);
    expect(feedWhileFollowing.articles.map((a) => a.slug)).toContain(article.slug);
    expect(unfollowed.following).toBe(false);
    expect(feedAfter.articles.map((a) => a.slug)).not.toContain(article.slug);
  });
});

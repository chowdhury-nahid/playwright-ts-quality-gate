import type { Page } from '@playwright/test';
import { ArticleList } from '../components/article-list';

export class ProfilePage {
  readonly articles: ArticleList;

  constructor(private readonly page: Page) {
    this.articles = new ArticleList(page);
  }

  /** The "My Articles" tab: a list only this user writes to, newest first. */
  async gotoArticles(username: string): Promise<void> {
    await this.page.goto(`/#/profile/${username}`);
  }

  async gotoFavorites(username: string): Promise<void> {
    await this.page.goto(`/#/profile/${username}/favorites`);
  }
}

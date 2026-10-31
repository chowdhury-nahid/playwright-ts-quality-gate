import type { Locator, Page } from '@playwright/test';
import { ArticleList } from '../components/article-list';

export class HomePage {
  private readonly articles: ArticleList;

  constructor(private readonly page: Page) {
    this.articles = new ArticleList(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/');
  }

  /** Logged-in users land on their own feed (followed authors); the global feed lists everything. */
  async openGlobalFeed(): Promise<void> {
    await this.page.getByText('Global Feed').click();
  }

  articleCard(title: string): Locator {
    return this.articles.card(title);
  }

  favoriteButton(title: string): Locator {
    return this.articles.favoriteButton(title);
  }

  /** Shown once a feed has loaded and is empty; use it to avoid asserting "hidden" while still loading. */
  get noArticlesMessage(): Locator {
    return this.page.getByText('Articles not available.');
  }
}

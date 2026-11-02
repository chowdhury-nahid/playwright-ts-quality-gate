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

  articleCard(title: string): Locator {
    return this.articles.card(title);
  }

  /** Shown once a feed has loaded and is empty; use it to avoid asserting "hidden" while still loading. */
  get noArticlesMessage(): Locator {
    return this.page.getByText('Articles not available.');
  }
}

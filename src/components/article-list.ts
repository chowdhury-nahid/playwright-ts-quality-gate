import type { Locator, Page } from '@playwright/test';

export class ArticleList {
  constructor(private readonly page: Page) {}

  /** Article cards are plain divs with this class; the app offers no role or test id. */
  card(title: string): Locator {
    return this.page
      .locator('.article-preview')
      .filter({ has: this.page.getByRole('heading', { name: title }) })
      .describe(`article card "${title}"`);
  }

  favoriteButton(title: string): Locator {
    return this.card(title).getByRole('button').describe(`favorite button of article "${title}"`);
  }
}

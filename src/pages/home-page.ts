import type { Locator, Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/#/');
  }

  /** Logged-in users land on the (empty) personal feed; the global feed lists everything. */
  async openGlobalFeed(): Promise<void> {
    await this.page.getByText('Global Feed').click();
  }

  /** Article cards are plain divs with this class; the app offers no role or test id. */
  articleCard(title: string): Locator {
    return this.page.locator('.article-preview').filter({ has: this.page.getByRole('heading', { name: title }) });
  }

  favoriteButton(title: string): Locator {
    return this.articleCard(title).getByRole('button');
  }
}

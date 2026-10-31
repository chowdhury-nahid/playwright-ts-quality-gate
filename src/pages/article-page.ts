import type { Locator, Page } from '@playwright/test';

export class ArticlePage {
  constructor(private readonly page: Page) {}

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/#/article/${slug}`);
  }

  heading(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }

  /** Comments render in plain card elements; the app gives them no role or label. */
  comment(text: string): Locator {
    return this.page.locator('.card').filter({ hasText: text });
  }

  /** The app asks "Want to delete the article?" with a browser confirm dialog; Playwright dismisses it unless accepted. */
  async deleteArticle(): Promise<void> {
    this.page.once('dialog', (dialog) => void dialog.accept());
    await this.page.getByRole('button', { name: 'Delete Article' }).click();
  }
}

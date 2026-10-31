import type { Locator, Page } from '@playwright/test';

export class ArticlePage {
  constructor(private readonly page: Page) {}

  heading(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }
}

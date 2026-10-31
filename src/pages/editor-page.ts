import type { Page } from '@playwright/test';
import type { NewArticle } from '../api/types';

export class EditorPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/#/editor');
  }

  async publish(article: NewArticle): Promise<void> {
    await this.page.getByPlaceholder('Article Title').fill(article.title);
    await this.page.getByPlaceholder("What's this article about?").fill(article.description);
    await this.page.getByPlaceholder('Write your article (in markdown)').fill(article.body);
    for (const tag of article.tagList) {
      await this.page.getByPlaceholder('Enter tags').fill(tag);
      await this.page.getByPlaceholder('Enter tags').press('Enter');
    }
    await this.page.getByRole('button', { name: 'Publish Article' }).click();
  }
}

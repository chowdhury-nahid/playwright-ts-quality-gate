import type { Locator, Page } from '@playwright/test';
import type { Credentials } from '../api/types';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/#/login');
  }

  async login(credentials: Credentials): Promise<void> {
    await this.page.getByPlaceholder('Email').fill(credentials.email);
    await this.page.getByPlaceholder('Password').fill(credentials.password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  /** Server errors render in a plain list under the heading; the app gives it no role or label. */
  get errorMessage(): Locator {
    return this.page.locator('ul.error-messages').describe('error messages');
  }
}

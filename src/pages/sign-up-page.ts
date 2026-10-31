import type { Page } from '@playwright/test';
import type { NewUser } from '../api/types';

export class SignUpPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/#/register');
  }

  async signUp(user: NewUser): Promise<void> {
    await this.page.getByPlaceholder('Your Name').fill(user.username);
    await this.page.getByPlaceholder('Email').fill(user.email);
    await this.page.getByPlaceholder('Password').fill(user.password);
    await this.page.getByRole('button', { name: 'Sign up' }).click();
  }
}

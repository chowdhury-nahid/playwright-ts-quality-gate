import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Article, Credentials, NewArticle, NewUser, User } from './types';

export class ConduitApi {
  constructor(private readonly request: APIRequestContext) {}

  async register(user: NewUser): Promise<User> {
    const res = await this.request.post('/api/users', { data: { user } });
    return (await this.parse<{ user: User }>(res, 'register')).user;
  }

  async login(credentials: Credentials): Promise<User> {
    const res = await this.loginRaw(credentials);
    return (await this.parse<{ user: User }>(res, 'login')).user;
  }

  /** Returns the raw response so tests can assert on failure status codes. */
  async loginRaw(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/api/users/login', { data: { user: credentials } });
  }

  async createArticle(token: string, article: NewArticle): Promise<Article> {
    const res = await this.request.post('/api/articles', {
      data: { article },
      headers: this.auth(token),
    });
    return (await this.parse<{ article: Article }>(res, 'createArticle')).article;
  }

  async listArticles(): Promise<Article[]> {
    const res = await this.request.get('/api/articles');
    return (await this.parse<{ articles: Article[] }>(res, 'listArticles')).articles;
  }

  async deleteArticle(token: string, slug: string): Promise<void> {
    const res = await this.request.delete(`/api/articles/${slug}`, { headers: this.auth(token) });
    if (!res.ok()) {
      throw new Error(`deleteArticle failed: ${res.status()} ${await res.text()}`);
    }
  }

  private auth(token: string): Record<string, string> {
    return { Authorization: `Token ${token}` };
  }

  private async parse<T>(res: APIResponse, action: string): Promise<T> {
    if (!res.ok()) {
      throw new Error(`${action} failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as T;
  }
}

import type { APIRequestContext, APIResponse } from '@playwright/test';
import type {
  Article,
  ArticleComment,
  ArticleList,
  ArticleQuery,
  Credentials,
  HttpMethod,
  NewArticle,
  NewUser,
  Profile,
  SendOptions,
  User,
} from './types';

export class ConduitApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Raw call for negative tests that assert on status codes. Everything else goes through typed methods. */
  async send(method: HttpMethod, path: string, options: SendOptions = {}): Promise<APIResponse> {
    return this.request.fetch(path, {
      method,
      headers: options.token ? this.auth(options.token) : undefined,
      data: options.data,
    });
  }

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
    const res = await this.send('POST', '/api/articles', { token, data: { article } });
    return (await this.parse<{ article: Article }>(res, 'createArticle')).article;
  }

  async getArticle(slug: string): Promise<Article> {
    const res = await this.send('GET', `/api/articles/${slug}`);
    return (await this.parse<{ article: Article }>(res, 'getArticle')).article;
  }

  async updateArticle(token: string, slug: string, patch: Partial<NewArticle>): Promise<Article> {
    const res = await this.send('PUT', `/api/articles/${slug}`, { token, data: { article: patch } });
    return (await this.parse<{ article: Article }>(res, 'updateArticle')).article;
  }

  async listArticles(): Promise<Article[]> {
    return (await this.searchArticles()).articles;
  }

  async searchArticles(query: ArticleQuery = {}): Promise<ArticleList> {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params[key] = value;
    }
    const res = await this.request.get('/api/articles', { params });
    return this.parse<ArticleList>(res, 'searchArticles');
  }

  async feed(token: string): Promise<ArticleList> {
    const res = await this.send('GET', '/api/articles/feed', { token });
    return this.parse<ArticleList>(res, 'feed');
  }

  async deleteArticle(token: string, slug: string): Promise<void> {
    const res = await this.send('DELETE', `/api/articles/${slug}`, { token });
    if (!res.ok()) {
      throw new Error(`deleteArticle failed: ${res.status()} ${await res.text()}`);
    }
  }

  async favorite(token: string, slug: string): Promise<Article> {
    const res = await this.send('POST', `/api/articles/${slug}/favorite`, { token });
    return (await this.parse<{ article: Article }>(res, 'favorite')).article;
  }

  async unfavorite(token: string, slug: string): Promise<Article> {
    const res = await this.send('DELETE', `/api/articles/${slug}/favorite`, { token });
    return (await this.parse<{ article: Article }>(res, 'unfavorite')).article;
  }

  async addComment(token: string, slug: string, body: string): Promise<ArticleComment> {
    const res = await this.send('POST', `/api/articles/${slug}/comments`, { token, data: { comment: { body } } });
    return (await this.parse<{ comment: ArticleComment }>(res, 'addComment')).comment;
  }

  async listComments(slug: string): Promise<ArticleComment[]> {
    const res = await this.send('GET', `/api/articles/${slug}/comments`);
    return (await this.parse<{ comments: ArticleComment[] }>(res, 'listComments')).comments;
  }

  async getProfile(username: string): Promise<Profile> {
    const res = await this.send('GET', `/api/profiles/${username}`);
    return (await this.parse<{ profile: Profile }>(res, 'getProfile')).profile;
  }

  async follow(token: string, username: string): Promise<Profile> {
    const res = await this.send('POST', `/api/profiles/${username}/follow`, { token });
    return (await this.parse<{ profile: Profile }>(res, 'follow')).profile;
  }

  async unfollow(token: string, username: string): Promise<Profile> {
    const res = await this.send('DELETE', `/api/profiles/${username}/follow`, { token });
    return (await this.parse<{ profile: Profile }>(res, 'unfollow')).profile;
  }

  async tags(): Promise<string[]> {
    const res = await this.send('GET', '/api/tags');
    return (await this.parse<{ tags: string[] }>(res, 'tags')).tags;
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

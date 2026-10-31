export interface Credentials {
  email: string;
  password: string;
}

export interface NewUser extends Credentials {
  username: string;
}

export interface User {
  email: string;
  username: string;
  token: string;
  bio?: string | null;
  image?: string | null;
}

export interface NewArticle {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface Article extends NewArticle {
  slug: string;
  favorited: boolean;
  favoritesCount: number;
  author: { username: string };
}

export interface ArticleList {
  articles: Article[];
  articlesCount: number;
}

export interface ArticleQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface ArticleComment {
  id: number;
  body: string;
  createdAt: string;
  author: { username: string };
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
  followersCount: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface SendOptions {
  token?: string;
  data?: unknown;
}

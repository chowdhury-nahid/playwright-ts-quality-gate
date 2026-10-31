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

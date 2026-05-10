export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  thumbnailImage: string;
  originalImage: string;
  category: string;
  categoryId: string;
  categorySlug: string;
  author: string;
  date: string;
  readTime: number;
  views: number;
  publishedAt?: string | null;
}

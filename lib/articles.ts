import { Article, ArticleCategory } from '../types/article';
import { MOBILE_API_BASE_URL } from './api-config';

const DEFAULT_ARTICLE_AUTHOR = 'Redaksi Trubus';
const DEFAULT_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=800&fit=crop';

type ApiEnvelope<T> = {
  data: T;
  meta?: {
    total?: number;
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    [key: string]: unknown;
  };
  message?: string;
};

type BackendArticleCategory = {
  id: string;
  name: string;
  slug?: string;
};

type BackendArticle = {
  id: string;
  slug: string;
  title: string;
  bannerOriginalUrl?: string | null;
  bannerThumbnailUrl?: string | null;
  content: string;
  views: number;
  publishedAt?: string | null;
  articleCategoryId: string;
  articleCategory: BackendArticleCategory;
};

type FetchArticlesParams = {
  page?: number;
  perPage?: number;
  search?: string;
  articleCategoryId?: string;
};

function slugifyArticleCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function stripHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<\/(p|div|section|article|h[1-6]|blockquote)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function getArticleContentParagraphs(content: string) {
  const normalized = decodeHtmlEntities(
    content
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/(p|div|section|article|h[1-6]|blockquote|ul|ol)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildExcerpt(content: string, maxLength = 170) {
  const plainText = stripHtml(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trimEnd()}...`;
}

function estimateReadTime(content: string) {
  const wordCount = stripHtml(content)
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 180));
}

function formatArticleDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatArticleDateLong(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function normalizeCategory(category: BackendArticleCategory): ArticleCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug || slugifyArticleCategory(category.name),
  };
}

function normalizeArticle(article: BackendArticle): Article {
  const category = normalizeCategory(article.articleCategory);
  const originalImage = article.bannerOriginalUrl || DEFAULT_ARTICLE_IMAGE;
  const thumbnailImage =
    article.bannerThumbnailUrl ||
    article.bannerOriginalUrl ||
    DEFAULT_ARTICLE_IMAGE;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: buildExcerpt(article.content),
    content: article.content,
    image: thumbnailImage,
    thumbnailImage,
    originalImage,
    category: category.name,
    categoryId: article.articleCategoryId,
    categorySlug: category.slug,
    author: DEFAULT_ARTICLE_AUTHOR,
    date: formatArticleDate(article.publishedAt),
    readTime: estimateReadTime(article.content),
    views: article.views,
    publishedAt: article.publishedAt ?? null,
  };
}

async function fetchMobileData<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Article request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  const data =
    typeof payload === 'object' && payload !== null && 'data' in payload
      ? (payload as ApiEnvelope<T>).data
      : (payload as T);
  const meta =
    typeof payload === 'object' && payload !== null && 'meta' in payload
      ? (payload as ApiEnvelope<T>).meta
      : undefined;

  return { data, meta };
}

export async function getMobileArticleCategories() {
  const response = await fetchMobileData<BackendArticleCategory[]>(
    '/api/v1/mobile/article-categories',
  );

  return Array.isArray(response.data)
    ? response.data.map(normalizeCategory)
    : [];
}

export async function getMobileArticles(params: FetchArticlesParams = {}) {
  const query = new URLSearchParams();

  if (params.page) {
    query.set('page', String(params.page));
  }

  if (params.perPage) {
    query.set('perPage', String(params.perPage));
  }

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.articleCategoryId) {
    query.set('articleCategoryId', params.articleCategoryId);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetchMobileData<BackendArticle[]>(
    `/api/v1/mobile/articles${suffix}`,
  );

  return {
    articles: Array.isArray(response.data)
      ? response.data.map(normalizeArticle)
      : [],
    meta: response.meta,
  };
}

export async function getMobileArticleById(id: string) {
  const response = await fetchMobileData<BackendArticle>(
    `/api/v1/mobile/articles/${encodeURIComponent(id)}`,
  );

  return normalizeArticle(response.data);
}

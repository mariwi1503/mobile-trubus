import { FaqCategory, FaqCategoryKey, FaqItem } from '../types/faq';
import { MOBILE_API_BASE_URL } from './api-config';

type ApiEnvelope<T> = {
  data: T;
  meta?: {
    [key: string]: unknown;
  };
  message?: string;
};

type BackendFaq = {
  id: string;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category: FaqCategoryKey;
  isPrioritized: boolean;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

type BackendFaqCategory = {
  key: FaqCategoryKey;
  label: string;
};

function buildFaqCategoryMap(categories: FaqCategory[]) {
  return new Map(categories.map((category) => [category.key, category.label]));
}

function normalizeFaq(
  item: BackendFaq,
  categoryMap: Map<FaqCategoryKey, string>
): FaqItem {
  return {
    id: item.id,
    order: item.order,
    category: categoryMap.get(item.category) || item.category,
    categoryKey: item.category,
    question: item.title,
    answer: item.content,
    isPrioritized: item.isPrioritized,
    updatedAt: item.updatedAt ?? null,
  };
}

async function fetchMobileData<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Faq request failed with ${response.status}`);
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

export async function getMobileFaqs() {
  const [faqResponse, categoryResponse] = await Promise.all([
    fetchMobileData<BackendFaq[]>('/api/v1/mobile/faqs'),
    fetchMobileData<BackendFaqCategory[]>('/api/v1/mobile/faqs/categories'),
  ]);

  const categories = Array.isArray(categoryResponse.data) ? categoryResponse.data : [];
  const categoryMap = buildFaqCategoryMap(categories);

  return Array.isArray(faqResponse.data)
    ? faqResponse.data.map((item) => normalizeFaq(item, categoryMap))
    : [];
}

export async function getMobileFaqCategories() {
  const response = await fetchMobileData<BackendFaqCategory[]>(
    '/api/v1/mobile/faqs/categories'
  );

  return Array.isArray(response.data) ? response.data : [];
}

export type FaqCategoryKey = string;

export interface FaqCategory {
  key: FaqCategoryKey;
  label: string;
}

export interface FaqItem {
  id: string;
  order: number;
  category: string;
  categoryKey: FaqCategoryKey;
  question: string;
  answer: string;
  isPrioritized: boolean;
  updatedAt?: string | null;
}

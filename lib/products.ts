import { Product, ProductCategory } from '../types/product';

const MOBILE_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=800&fit=crop';
const DEFAULT_PRODUCT_STORE = 'Trubus Official Store';
const DEFAULT_PRODUCT_WEIGHT = 500;
const DEFAULT_PRODUCT_RATING = 4.8;
const DEFAULT_PRODUCT_STOCK = 100;

const CATEGORY_THEME_BY_SLUG: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  bibit: { icon: 'leaf', color: '#4CAF50', bg: '#E8F5E9' },
  benih: { icon: 'flower-outline', color: '#8BC34A', bg: '#F1F8E9' },
  pupuk: { icon: 'flask', color: '#CDDC39', bg: '#F9FBE7' },
  'media-tanam': { icon: 'layers', color: '#795548', bg: '#EFEBE9' },
  media: { icon: 'layers', color: '#795548', bg: '#EFEBE9' },
  pestisida: { icon: 'shield-checkmark', color: '#FF9800', bg: '#FFF3E0' },
  'alat-tani': { icon: 'construct', color: '#F44336', bg: '#FFEBEE' },
  alat: { icon: 'construct', color: '#F44336', bg: '#FFEBEE' },
  edukasi: { icon: 'book-outline', color: '#9C27B0', bg: '#F3E5F5' },
};

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  media: 'media-tanam',
  alat: 'alat-tani',
};

type ApiEnvelope<T> = {
  data: T;
  meta?: {
    total?: number;
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    [key: string]: unknown;
  };
};

type BackendProductCategory = {
  id: string;
  name: string;
};

type BackendProduct = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  uom: string;
  isShownInApp: boolean;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  soldCount: number;
  productCategoryId: string;
  productCategory: BackendProductCategory;
  createdAt: string;
  updatedAt: string;
};

type BackendProductDetail = BackendProduct;

type FetchProductsParams = {
  page?: number;
  perPage?: number;
  search?: string;
  productCategoryId?: string;
};

export function slugifyProductCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveProductCategorySlug(slug?: string | null) {
  if (!slug) {
    return '';
  }

  return CATEGORY_SLUG_ALIASES[slug] || slug;
}

function getProductCategoryTheme(slug: string) {
  return (
    CATEGORY_THEME_BY_SLUG[slug] || {
      icon: 'apps',
      color: '#607D8B',
      bg: '#ECEFF1',
    }
  );
}

function normalizeCategory(category: BackendProductCategory): ProductCategory {
  const slug = resolveProductCategorySlug(slugifyProductCategory(category.name));
  const theme = getProductCategoryTheme(slug);

  return {
    id: category.id,
    name: category.name,
    slug,
    icon: theme.icon,
    color: theme.color,
    bg: theme.bg,
  };
}

function normalizeProduct(product: BackendProduct): Product {
  const category = normalizeCategory(product.productCategory);
  const originalImage = product.imageUrl || DEFAULT_PRODUCT_IMAGE;
  const thumbnailImage =
    product.thumbnailUrl || product.imageUrl || DEFAULT_PRODUCT_IMAGE;

  return {
    id: product.id,
    slug: product.slug,
    code: product.code,
    name: product.name,
    description: product.description,
    price: product.price,
    uom: product.uom,
    image: thumbnailImage,
    thumbnailImage,
    originalImage,
    sold: product.soldCount,
    rating: DEFAULT_PRODUCT_RATING,
    stock: DEFAULT_PRODUCT_STOCK,
    category: category.name,
    categoryId: product.productCategoryId,
    categorySlug: category.slug,
    weight: DEFAULT_PRODUCT_WEIGHT,
    store: DEFAULT_PRODUCT_STORE,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function fetchMobileData<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Product request failed with ${response.status}`);
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

export async function getMobileProductCategories() {
  const response = await fetchMobileData<BackendProductCategory[]>(
    '/api/v1/mobile/product-categories',
  );

  return Array.isArray(response.data)
    ? response.data.map(normalizeCategory)
    : [];
}

export async function getMobileProducts(params: FetchProductsParams = {}) {
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

  if (params.productCategoryId) {
    query.set('productCategoryId', params.productCategoryId);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetchMobileData<BackendProduct[]>(
    `/api/v1/mobile/products${suffix}`,
  );

  return {
    products: Array.isArray(response.data)
      ? response.data.map(normalizeProduct)
      : [],
    meta: response.meta,
  };
}

export async function getMobileProductById(id: string) {
  const response = await fetchMobileData<BackendProductDetail>(
    `/api/v1/mobile/products/${encodeURIComponent(id)}`,
  );

  return normalizeProduct(response.data);
}

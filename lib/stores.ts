import type { Store } from '../types/store';
import { MOBILE_API_BASE_URL } from './api-config';

type ApiEnvelope<T> = {
  data: T;
  meta?: {
    total?: number;
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    [key: string]: unknown;
  };
  message?: string | string[];
  error?: string;
};

type BackendProvince = {
  id: string;
  name: string;
  rajaOngkirId: number;
};

type BackendCity = {
  id: string;
  name: string;
  rajaOngkirId: number;
  zipCode?: string | null;
  province?: BackendProvince | null;
};

type BackendDistrict = {
  id: string;
  name: string;
  rajaOngkirId: number;
  city?: BackendCity | null;
};

type BackendSubDistrict = {
  id: string;
  name: string;
  rajaOngkirId: number;
  zipCode?: string | null;
  district?: BackendDistrict | null;
};

type BackendStore = {
  id: string;
  name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  address: string;
  rajaOngkirSubDistrict?: BackendSubDistrict | null;
  isOnlineOrderSupported: boolean;
  createdAt: string;
  updatedAt: string;
};

type FetchStoresParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

function formatErrorMessage(payload: unknown, status: number) {
  if (!payload || typeof payload !== 'object') {
    return `Request failed with ${status}`;
  }

  if ('message' in payload) {
    const { message } = payload as ApiEnvelope<unknown>;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const formattedMessage = message
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .join('\n');

      if (formattedMessage) {
        return formattedMessage;
      }
    }
  }

  if ('error' in payload && typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  return `Request failed with ${status}`;
}

function parseCoordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsedValue =
    typeof value === 'number' ? value : Number.parseFloat(String(value));

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function normalizeStore(store: BackendStore): Store {
  const province = store.rajaOngkirSubDistrict?.district?.city?.province;
  const city = store.rajaOngkirSubDistrict?.district?.city;
  const district = store.rajaOngkirSubDistrict?.district;
  const subDistrict = store.rajaOngkirSubDistrict;

  return {
    id: store.id,
    name: store.name,
    address: store.address,
    city: city?.name || '',
    province: province?.name || '',
    district: district?.name || '',
    subDistrict: subDistrict?.name || '',
    postalCode: subDistrict?.zipCode || city?.zipCode || '',
    latitude: parseCoordinate(store.latitude),
    longitude: parseCoordinate(store.longitude),
    isOnlineOrderSupported: Boolean(store.isOnlineOrderSupported),
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

async function fetchMobileData<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  const rawText = await response.text();
  let payload: ApiEnvelope<T> | T | string | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiEnvelope<T> | T;
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    if (typeof payload === 'string') {
      throw new Error(payload.trim() || `Request failed with ${response.status}`);
    }

    throw new Error(formatErrorMessage(payload, response.status));
  }

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

export async function getMobileStores(params: FetchStoresParams = {}) {
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

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetchMobileData<BackendStore[]>(
    `/api/v1/mobile/stores${suffix}`,
  );

  return {
    stores: Array.isArray(response.data)
      ? response.data.map(normalizeStore)
      : [],
    meta: response.meta,
  };
}

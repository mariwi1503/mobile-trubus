import { MOBILE_API_BASE_URL } from './api-config';

type ApiEnvelope<T> = {
  data: T;
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

export type ShippingLocationOption = {
  id: number;
  name: string;
  zipCode?: string;
};

export type ShippingQuoteStore = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  distanceKm: number;
  latitude?: number;
  longitude?: number;
};

export type ShippingCourierOption = {
  id: string;
  courierCode: string;
  courierName: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};

export type ResolveShippingQuoteResult = {
  addressId: string;
  weight: number;
  selectedStore: ShippingQuoteStore;
  couriers: ShippingCourierOption[];
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

async function parseResponse<T>(response: Response): Promise<T> {
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

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

async function requestPublicMobileApi<T>(path: string): Promise<T> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  return parseResponse<T>(response);
}

function buildAuthorizedHeaders(accessToken: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

async function requestAuthorizedMobileApi<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    ...init,
    headers: buildAuthorizedHeaders(accessToken, init),
  });

  return parseResponse<T>(response);
}

type BackendShippingLocation = {
  id: number;
  name: string;
  zip_code?: string;
};

function mapShippingLocation(option: BackendShippingLocation): ShippingLocationOption {
  return {
    id: option.id,
    name: option.name,
    zipCode: option.zip_code,
  };
}

export async function getShippingProvinces() {
  const data = await requestPublicMobileApi<BackendShippingLocation[]>(
    '/api/v1/mobile/shipping/provinces',
  );

  return data.map(mapShippingLocation);
}

export async function getShippingCities(provinceId: number) {
  const data = await requestPublicMobileApi<BackendShippingLocation[]>(
    `/api/v1/mobile/shipping/cities?provinceId=${provinceId}`,
  );

  return data.map(mapShippingLocation);
}

export async function getShippingDistricts(cityId: number) {
  const data = await requestPublicMobileApi<BackendShippingLocation[]>(
    `/api/v1/mobile/shipping/districts?cityId=${cityId}`,
  );

  return data.map(mapShippingLocation);
}

export async function getShippingSubDistricts(districtId: number) {
  const data = await requestPublicMobileApi<BackendShippingLocation[]>(
    `/api/v1/mobile/shipping/villages?districtId=${districtId}`,
  );

  return data.map(mapShippingLocation);
}

export async function resolveShippingQuote(
  accessToken: string,
  payload: {
    addressId: string;
    weight?: number;
    courier?: string;
  },
) {
  return requestAuthorizedMobileApi<ResolveShippingQuoteResult>(
    '/api/v1/mobile/shipping/quote',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

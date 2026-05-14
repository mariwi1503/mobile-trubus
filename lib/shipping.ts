const MOBILE_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

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

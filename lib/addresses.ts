import type { Address } from '../types/address';
import { MOBILE_API_BASE_URL } from './api-config';
import { normalizeIndonesianMobilePhone } from './auth';

type ApiEnvelope<T> = {
  data: T;
  message?: string | string[];
  statusCode?: number;
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

export type BackendMobileUserAddress = {
  id: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  additional?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isPrimary: boolean;
  label?: string | null;
  recipientName?: string | null;
  phone?: string | null;
  rajaOngkirSubDistrict?: BackendSubDistrict | null;
};

export type CreateMobileUserAddressPayload = {
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  additional?: string;
  latitude: number;
  longitude: number;
  rajaOngkirSubDistrictId: number;
  isPrimary?: boolean;
};

export type UpdateMobileUserAddressPayload = Partial<CreateMobileUserAddressPayload>;

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

function buildHeaders(accessToken: string, init?: RequestInit) {
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

async function requestAuthorizedMobileApi<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(accessToken, init),
  });

  return parseResponse<T>(response);
}

export function mapBackendUserAddressToAddress(
  backendAddress: BackendMobileUserAddress,
): Address {
  const province = backendAddress.rajaOngkirSubDistrict?.district?.city?.province;
  const city = backendAddress.rajaOngkirSubDistrict?.district?.city;
  const district = backendAddress.rajaOngkirSubDistrict?.district;
  const subDistrict = backendAddress.rajaOngkirSubDistrict;

  return {
    id: backendAddress.id,
    label: backendAddress.label?.trim() || 'Alamat',
    recipient: backendAddress.recipientName?.trim() || 'Penerima',
    phone: backendAddress.phone?.trim() || '',
    address: backendAddress.address,
    additional: backendAddress.additional?.trim() || undefined,
    latitude: parseCoordinate(backendAddress.latitude),
    longitude: parseCoordinate(backendAddress.longitude),
    city: city?.name || '',
    province: province?.name || '',
    district: district?.name || '',
    subDistrict: subDistrict?.name || '',
    postalCode: subDistrict?.zipCode || city?.zipCode || '',
    isDefault: backendAddress.isPrimary,
    provinceRajaOngkirId: province?.rajaOngkirId,
    cityRajaOngkirId: city?.rajaOngkirId,
    districtRajaOngkirId: district?.rajaOngkirId,
    subDistrictRajaOngkirId: subDistrict?.rajaOngkirId,
  };
}

function normalizeCreatePayload(payload: CreateMobileUserAddressPayload) {
  return {
    label: payload.label.trim(),
    recipientName: payload.recipientName.trim(),
    phone: normalizeIndonesianMobilePhone(payload.phone),
    address: payload.address.trim(),
    additional: payload.additional?.trim() || undefined,
    latitude: payload.latitude,
    longitude: payload.longitude,
    rajaOngkirSubDistrictId: payload.rajaOngkirSubDistrictId,
    isPrimary: payload.isPrimary,
  };
}

function normalizeUpdatePayload(payload: UpdateMobileUserAddressPayload) {
  return {
    label: payload.label?.trim(),
    recipientName: payload.recipientName?.trim(),
    phone: payload.phone ? normalizeIndonesianMobilePhone(payload.phone) : undefined,
    address: payload.address?.trim(),
    additional: payload.additional?.trim() || undefined,
    latitude: payload.latitude,
    longitude: payload.longitude,
    rajaOngkirSubDistrictId: payload.rajaOngkirSubDistrictId,
    isPrimary: payload.isPrimary,
  };
}

export async function getMobileUserAddresses(accessToken: string) {
  const data = await requestAuthorizedMobileApi<BackendMobileUserAddress[]>(
    '/api/v1/mobile/users/addresses',
    accessToken,
  );

  return data.map(mapBackendUserAddressToAddress);
}

export async function createMobileUserAddress(
  accessToken: string,
  payload: CreateMobileUserAddressPayload,
) {
  const data = await requestAuthorizedMobileApi<BackendMobileUserAddress>(
    '/api/v1/mobile/users/addresses',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(normalizeCreatePayload(payload)),
    },
  );

  return mapBackendUserAddressToAddress(data);
}

export async function updateMobileUserAddress(
  accessToken: string,
  id: string,
  payload: UpdateMobileUserAddressPayload,
) {
  const data = await requestAuthorizedMobileApi<BackendMobileUserAddress>(
    `/api/v1/mobile/users/addresses/${encodeURIComponent(id)}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(normalizeUpdatePayload(payload)),
    },
  );

  return mapBackendUserAddressToAddress(data);
}

export async function deleteMobileUserAddress(accessToken: string, id: string) {
  await requestAuthorizedMobileApi<void>(
    `/api/v1/mobile/users/addresses/${encodeURIComponent(id)}`,
    accessToken,
    {
      method: 'DELETE',
    },
  );
}

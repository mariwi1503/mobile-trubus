import type { Address } from '../types/address';
import { MOBILE_API_BASE_URL } from './api-config';

type ApiEnvelope<T> = {
  data: T;
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

export type MobileProductOrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
  weight?: number;
  store?: string | null;
};

export type MobileProductOrder = {
  id: string;
  orderCode: string;
  type: 'product';
  items?: MobileProductOrderItem[];
  totalAmount: number;
  shippingCost?: number;
  fulfillmentMethod?: 'delivery' | 'pickup';
  coinRedemptionCost?: number;
  courier?: string;
  address?: Address;
  store?: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'expired';
  paymentMethod?: string;
  paymentGateway?: 'midtrans';
  paymentProviderOrderId?: string;
  paymentRedirectUrl?: string;
  paymentType?: string;
  paymentExpiresAt?: string;
  paymentStatusDetail?: string;
  paymentUpdatedAt?: string;
  createdAt: string;
  updatedAt?: string;
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

export async function getMobileProductOrders(accessToken: string) {
  return requestAuthorizedMobileApi<MobileProductOrder[]>(
    '/api/v1/mobile/payments/orders',
    accessToken,
  );
}

export async function getMobileProductOrderByCode(
  accessToken: string,
  orderCode: string,
) {
  return requestAuthorizedMobileApi<MobileProductOrder>(
    `/api/v1/mobile/payments/orders/${encodeURIComponent(orderCode)}`,
    accessToken,
  );
}

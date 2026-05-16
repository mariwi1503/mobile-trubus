import { MOBILE_API_BASE_URL } from './api-config';

type ApiEnvelope<T> = {
  data: T;
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

export type MobilePaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export type MobilePaymentOrderType = 'product' | 'consultation';

export type MidtransLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

export type MidtransCustomerPayload = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
};

export type MidtransAddressPayload = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode?: string;
};

export type CreateMidtransPaymentPayload = {
  orderCode: string;
  orderType: MobilePaymentOrderType;
  grossAmount: number;
  shippingAmount?: number;
  items: MidtransLineItem[];
  customer: MidtransCustomerPayload;
  shippingAddress?: MidtransAddressPayload;
  returnUrl?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type MidtransPaymentSession = {
  orderCode: string;
  redirectUrl: string;
  transactionStatus: string;
  paymentStatus: MobilePaymentStatus;
  paymentMethod?: string | null;
  paymentType?: string | null;
  expiresAt?: string | null;
  statusCode?: string | null;
};

export type MidtransPaymentStatusResponse = {
  orderCode: string;
  transactionStatus: string;
  paymentStatus: MobilePaymentStatus;
  paymentMethod?: string | null;
  paymentType?: string | null;
  redirectUrl?: string | null;
  expiresAt?: string | null;
  statusCode?: string | null;
  updatedAt?: string | null;
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

function buildHeaders(accessToken?: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as ApiEnvelope<T> | T) : null;

  if (!response.ok) {
    throw new Error(formatErrorMessage(payload, response.status));
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

async function requestMobileApi<T>(
  path: string,
  options: {
    accessToken?: string;
    init?: RequestInit;
  } = {},
): Promise<T> {
  const { accessToken, init } = options;
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(accessToken, init),
  });

  return parseResponse<T>(response);
}

export async function createMidtransPaymentSession(
  payload: CreateMidtransPaymentPayload,
  accessToken?: string,
) {
  return requestMobileApi<MidtransPaymentSession>(
    '/api/v1/mobile/payments/midtrans/session',
    {
      accessToken,
      init: {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    },
  );
}

export async function getMobilePaymentStatus(
  orderCode: string,
  options: {
    accessToken?: string;
    refresh?: boolean;
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (options.refresh) {
    searchParams.set('refresh', 'true');
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return requestMobileApi<MidtransPaymentStatusResponse>(
    `/api/v1/mobile/payments/orders/${encodeURIComponent(orderCode)}/status${suffix}`,
    {
      accessToken: options.accessToken,
    },
  );
}

const MOBILE_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

type ApiEnvelope<T> = {
  data: T;
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

const INDONESIAN_MOBILE_PHONE_PATTERN = /^(?:08\d{8,11}|628\d{8,11}|\+628\d{8,11})$/;

type PasswordValidationOptions = {
  minLength?: number;
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

export function validateIndonesianMobilePhone(phone: string) {
  const normalizedPhone = phone.trim();

  if (!normalizedPhone) {
    return 'Nomor HP wajib diisi';
  }

  if (!INDONESIAN_MOBILE_PHONE_PATTERN.test(normalizedPhone)) {
    return 'Nomor HP harus memakai format Indonesia: 08xxx, 628xxx, atau +628xxx';
  }

  return null;
}

export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {},
) {
  const { minLength = 1 } = options;
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    return 'Password wajib diisi';
  }

  if (normalizedPassword.length < minLength) {
    return `Password minimal ${minLength} karakter`;
  }

  return null;
}

export type BackendMobileAuthResponse = {
  accessToken: string;
};

export type BackendMobileUser = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  gender: 'MALE' | 'FEMALE';
  status: 'ACTIVE' | 'BANNED';
};

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
  });

  return parseResponse<T>(response);
}

export async function loginMobileUser(phone: string, password: string) {
  return requestMobileApi<BackendMobileAuthResponse>(
    '/api/v1/mobile/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    },
  );
}

export async function getMobileUserProfile(accessToken: string) {
  return requestMobileApi<BackendMobileUser>('/api/v1/mobile/users/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

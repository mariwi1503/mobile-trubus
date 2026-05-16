import { MOBILE_API_BASE_URL } from './api-config';

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

export type MobileConsumerGender = 'MALE' | 'FEMALE';

export type MobileRegisterOtpValidationResponse = {
  registrationToken: string;
};

export type RegisterMobileCustomerPayload = {
  registrationToken: string;
  email: string;
  firstName: string;
  lastName?: string;
  gender: MobileConsumerGender;
  password: string;
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

export function normalizeIndonesianMobilePhone(phone: string) {
  const digitsOnly = phone.trim().replace(/[^0-9]/g, '');

  if (!digitsOnly) {
    return '';
  }

  if (digitsOnly.startsWith('0')) {
    return `62${digitsOnly.slice(1)}`;
  }

  return digitsOnly;
}

export function validateEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return 'Email wajib diisi';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return 'Format email tidak valid';
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
  accountType: 'consumer' | 'expert';
};

type BackendMobileConsumerProfile = {
  accountType: 'consumer';
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

type BackendMobileExpertProfile = {
  accountType: 'expert';
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'BANNED';
  presenceStatus: 'online' | 'busy' | 'offline';
  specialization: string;
  experience: number;
  rating: number;
  totalConsultations: number;
  bio: string;
  price: number;
  isActive: boolean;
  imageOriginalUrl?: string | null;
  imageThumbnailUrl?: string | null;
};

export type BackendMobileProfile =
  | BackendMobileConsumerProfile
  | BackendMobileExpertProfile;

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
      body: JSON.stringify({
        phone: normalizeIndonesianMobilePhone(phone),
        password,
      }),
    },
  );
}

export async function requestMobileRegistrationOtp(phone: string) {
  return requestMobileApi<void>('/api/v1/mobile/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      phone: normalizeIndonesianMobilePhone(phone),
    }),
  });
}

export async function verifyMobileRegistrationOtp(phone: string, otp: string) {
  return requestMobileApi<MobileRegisterOtpValidationResponse>(
    '/api/v1/mobile/auth/register/otp-validation',
    {
      method: 'POST',
      body: JSON.stringify({
        phone: normalizeIndonesianMobilePhone(phone),
        otp: otp.trim(),
      }),
    },
  );
}

export async function registerMobileCustomer(
  payload: RegisterMobileCustomerPayload,
) {
  return requestMobileApi<BackendMobileProfile>('/api/v1/mobile/auth/register/data', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMobileUserProfile(accessToken: string) {
  return requestMobileApi<BackendMobileProfile>('/api/v1/mobile/users/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateMobileExpertPresenceStatus(
  accessToken: string,
  presenceStatus: 'online' | 'busy' | 'offline',
) {
  return requestMobileApi<BackendMobileExpertProfile>(
    '/api/v1/mobile/experts/profile/status',
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ presenceStatus }),
    },
  );
}

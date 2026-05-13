import { Consultation, ConsultationSlot } from '../types/consultation';

const MOBILE_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

type ApiEnvelope<T> = {
  data: T;
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

type BackendConsultation = {
  id: string;
  orderCode: string;
  status: Consultation['status'];
  scheduledAt: string;
  durationMinutes: number;
  price: number;
  expiresAt: string;
  paymentMethod?: string | null;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    gender: 'MALE' | 'FEMALE';
  };
  expert: {
    id: string;
    name: string;
    specialization: string;
    imageOriginalUrl?: string | null;
    imageThumbnailUrl?: string | null;
    isActive: boolean;
  };
};

type BackendConsultationSlotsResponse = {
  expertId: string;
  slots: ConsultationSlot[];
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

function fallbackImage(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=E8F5E9&color=1B5E20&size=256`;
}

function formatScheduledDateParts(isoString: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(isoString));

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';

  return {
    consultationDate: `${year}-${month}-${day}`,
    consultationTime: `${hour}:${minute}`,
  };
}

function normalizeConsultation(consultation: BackendConsultation): Consultation {
  const { consultationDate, consultationTime } = formatScheduledDateParts(
    consultation.scheduledAt,
  );
  const clientName = consultation.user
    ? [consultation.user.firstName, consultation.user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Klien'
    : undefined;
  const clientAvatar = consultation.user
    ? consultation.user.gender === 'FEMALE'
      ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
    : undefined;

  return {
    id: consultation.orderCode,
    orderCode: consultation.orderCode,
    status: consultation.status,
    expertId: consultation.expert.id,
    expertName: consultation.expert.name,
    expertSpecialization: consultation.expert.specialization,
    expertImage:
      consultation.expert.imageThumbnailUrl ||
      consultation.expert.imageOriginalUrl ||
      fallbackImage(consultation.expert.name),
    expertIsOnline: consultation.expert.isActive,
    scheduledAt: consultation.scheduledAt,
    consultationDate,
    consultationTime,
    durationMinutes: consultation.durationMinutes,
    totalAmount: consultation.price,
    expiresAt: consultation.expiresAt,
    paymentMethod: consultation.paymentMethod,
    createdAt: consultation.createdAt,
    updatedAt: consultation.updatedAt,
    contactName: consultation.contactName,
    contactPhone: consultation.contactPhone,
    clientName,
    clientPhone: consultation.user?.phone,
    clientAvatar,
  };
}

export async function getMobileExpertConsultationSlots(expertId: string, days = 7) {
  const response = await requestMobileApi<BackendConsultationSlotsResponse>(
    `/api/v1/mobile/consultations/experts/${encodeURIComponent(expertId)}/slots?days=${days}`,
  );

  return response.slots;
}

export async function createMobileConsultation(
  accessToken: string,
  payload: {
    expertId: string;
    consultationDate: string;
    consultationTime: string;
    durationMinutes?: number;
    contactName?: string;
    contactPhone?: string;
  },
) {
  const response = await requestMobileApi<BackendConsultation>(
    '/api/v1/mobile/consultations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return normalizeConsultation(response);
}

export async function getMobileConsultations(accessToken: string) {
  const response = await requestMobileApi<BackendConsultation[]>(
    '/api/v1/mobile/consultations',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.map(normalizeConsultation);
}

export async function getMobileConsultationById(
  accessToken: string,
  identifier: string,
) {
  const response = await requestMobileApi<BackendConsultation>(
    `/api/v1/mobile/consultations/${encodeURIComponent(identifier)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return normalizeConsultation(response);
}

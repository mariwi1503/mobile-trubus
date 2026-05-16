import { Expert, ExpertCategory, ExpertSlot } from '../types/expert';
import { MOBILE_API_BASE_URL } from './api-config';

const DEFAULT_EXPERT_IMAGE = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=400&fit=crop';

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

type BackendExpert = {
  id: string;
  name: string;
  presenceStatus?: 'online' | 'busy' | 'offline';
  specialization: string;
  experience: number;
  rating: number;
  totalConsultations: number;
  bio: string;
  price: number;
  isActive: boolean;
  imageOriginalUrl?: string | null;
  imageThumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

type FetchExpertsParams = {
  page?: number;
  perPage?: number;
  search?: string;
  specialization?: string;
  isActive?: boolean;
};

export const EXPERT_CATEGORIES: ExpertCategory[] = [
  { id: 'all', name: 'Semua', icon: 'apps' },
  { id: 'hama', name: 'Hama & Penyakit', icon: 'bug' },
  { id: 'tanah', name: 'Kesuburan Tanah', icon: 'leaf' },
  { id: 'tanaman', name: 'Budidaya Tanaman', icon: 'flower' },
  { id: 'hidroponik', name: 'Hidroponik', icon: 'water' },
  { id: 'organik', name: 'Pertanian Organik', icon: 'nutrition' },
  { id: 'perkebunan', name: 'Perkebunan', icon: 'globe' },
];

function generateUpcomingSlots(days = 7): ExpertSlot[] {
  const slots: ExpertSlot[] = [];
  const today = new Date();

  for (let index = 1; index <= days; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    slots.push({
      date: date.toISOString().split('T')[0],
      times: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
    });
  }

  return slots;
}

function inferExpertCategory(specialization: string) {
  const normalized = specialization.toLowerCase();

  if (normalized.includes('hama') || normalized.includes('penyakit')) {
    return 'hama';
  }

  if (normalized.includes('tanah') || normalized.includes('irigasi') || normalized.includes('air')) {
    return 'tanah';
  }

  if (normalized.includes('hidroponik') || normalized.includes('urban farming')) {
    return 'hidroponik';
  }

  if (normalized.includes('organik')) {
    return 'organik';
  }

  if (
    normalized.includes('perkebunan') ||
    normalized.includes('sawit') ||
    normalized.includes('karet') ||
    normalized.includes('kopi') ||
    normalized.includes('kakao')
  ) {
    return 'perkebunan';
  }

  return 'tanaman';
}

function fallbackImage(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=E8F5E9&color=1B5E20&size=256`;
}

function normalizeExpert(expert: BackendExpert): Expert {
  const image =
    expert.imageThumbnailUrl ||
    expert.imageOriginalUrl ||
    fallbackImage(expert.name) ||
    DEFAULT_EXPERT_IMAGE;

  return {
    id: expert.id,
    name: expert.name,
    specialization: expert.specialization,
    category: inferExpertCategory(expert.specialization),
    image,
    rating: expert.rating || 0,
    reviews: expert.totalConsultations || 0,
    experience: expert.experience || 0,
    fee: expert.price || 0,
    bio: expert.bio || 'Informasi profil ahli akan segera diperbarui.',
    education: 'Informasi pendidikan akan segera diperbarui.',
    certifications: [],
    languages: ['Indonesia'],
    isOnline: expert.presenceStatus === 'online',
    presenceStatus: expert.presenceStatus || 'offline',
    availableSlots: generateUpcomingSlots(),
    createdAt: expert.createdAt,
    updatedAt: expert.updatedAt,
  };
}

async function fetchMobileData<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Expert request failed with ${response.status}`);
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

export async function getMobileExperts(params: FetchExpertsParams = {}) {
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

  if (params.specialization?.trim()) {
    query.set('specialization', params.specialization.trim());
  }

  if (params.isActive !== undefined) {
    query.set('isActive', String(params.isActive));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetchMobileData<BackendExpert[]>(
    `/api/v1/mobile/experts${suffix}`,
  );

  return {
    experts: Array.isArray(response.data)
      ? response.data.map(normalizeExpert)
      : [],
    meta: response.meta,
  };
}

export async function getMobileExpertById(id: string) {
  const response = await fetchMobileData<BackendExpert>(
    `/api/v1/mobile/experts/${encodeURIComponent(id)}`,
  );

  return normalizeExpert(response.data);
}

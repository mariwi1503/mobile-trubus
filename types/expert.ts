export interface ExpertSlot {
  date: string;
  times: string[];
}

export interface Expert {
  id: string;
  name: string;
  specialization: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  experience: number;
  fee: number;
  bio: string;
  education: string;
  certifications: string[];
  languages: string[];
  isOnline: boolean;
  availableSlots: ExpertSlot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpertCategory {
  id: string;
  name: string;
  icon: string;
}

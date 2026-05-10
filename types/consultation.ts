export interface ConsultationSlot {
  date: string;
  times: string[];
}

export interface Consultation {
  id: string;
  orderCode: string;
  status: 'pending_payment' | 'paid' | 'completed' | 'cancelled' | 'expired';
  expertId: string;
  expertName: string;
  expertSpecialization: string;
  expertImage: string;
  expertIsOnline: boolean;
  scheduledAt: string;
  consultationDate: string;
  consultationTime: string;
  durationMinutes: number;
  totalAmount: number;
  expiresAt: string;
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
  contactName: string;
  contactPhone: string;
}

import type { Order } from '../context/AppContext';
import type { Consultation } from '../types/consultation';

export function consultationToOrder(consultation: Consultation): Order {
  return {
    id: consultation.orderCode,
    orderCode: consultation.orderCode,
    type: 'consultation',
    expertId: consultation.expertId,
    expertName: consultation.expertName,
    expertImage: consultation.expertImage,
    expertSpecialization: consultation.expertSpecialization,
    consultationDate: consultation.consultationDate,
    consultationTime: consultation.consultationTime,
    totalAmount: consultation.totalAmount,
    status: consultation.status,
    paymentMethod: consultation.paymentMethod || undefined,
    paymentGateway: 'midtrans',
    paymentProviderOrderId: consultation.orderCode,
    paymentExpiresAt: consultation.expiresAt,
    paymentUpdatedAt: consultation.updatedAt,
    createdAt: consultation.createdAt,
    clientName: consultation.contactName,
    clientPhone: consultation.contactPhone,
  };
}

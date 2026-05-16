import type { Order } from '../context/AppContext';

export const PRODUCT_ORDER_STATUS_MAP: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  draft: { label: 'Draft Pembayaran', color: '#FB8C00', bg: '#FFF3E0', icon: 'document-text' },
  pending_payment: { label: 'Menunggu Pembayaran', color: '#FF9800', bg: '#FFF3E0', icon: 'hourglass' },
  paid: { label: 'Dibayar', color: '#2196F3', bg: '#E3F2FD', icon: 'checkmark-circle' },
  processing: { label: 'Diproses', color: '#9C27B0', bg: '#F3E5F5', icon: 'cube' },
  shipped: { label: 'Dikirim', color: '#4CAF50', bg: '#E8F5E9', icon: 'car' },
  delivered: { label: 'Diterima', color: '#4CAF50', bg: '#E8F5E9', icon: 'checkmark-done' },
  completed: { label: 'Selesai', color: '#607D8B', bg: '#ECEFF1', icon: 'flag' },
  cancelled: { label: 'Dibatalkan', color: '#F44336', bg: '#FFEBEE', icon: 'close-circle' },
  expired: { label: 'Kedaluwarsa', color: '#8D6E63', bg: '#EFEBE9', icon: 'time' },
};

export function canRetryProductOrderPayment(order: Pick<Order, 'status' | 'type'>) {
  return order.type === 'product'
    && (order.status === 'draft' || order.status === 'pending_payment' || order.status === 'expired' || order.status === 'cancelled');
}

export function isOrderAwaitingPayment(status?: string) {
  return status === 'draft' || status === 'pending_payment';
}

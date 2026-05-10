import type { Order } from '../context/AppContext';

export function getOrderDisplayCode(
  order?: Pick<Order, 'orderCode' | 'id'> | null,
  fallbackId?: string,
) {
  return order?.orderCode || fallbackId || order?.id || '-';
}

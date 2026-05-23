import { apiClient } from './api';
import { ENDPOINTS } from '../constants/Api';
import { Order } from '../types';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  ordered:           'Order Placed',
  processing:        'Processing',
  dispatched:        'Dispatched',
  in_transit:        'In Transit',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
};

export const ORDER_STATUS_STEPS = [
  'ordered',
  'processing',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

function mapOrder(raw: any): Order {
  const items = (raw.items ?? []).map((it: any) => ({
    title:           it.listing?.title ?? it.title ?? 'Unknown Item',
    author:          it.listing?.author ?? it.author,
    quantity:        Number(it.quantity) || 1,
    priceAtPurchase: Number(it.priceAtPurchase ?? it.price) || 0,
  }));

  const sa = raw.shippingAddress ?? {};
  const shippingAddress = {
    name:       sa.fullName ?? sa.name ?? '',
    street:     [sa.addressLine1, sa.addressLine2].filter(Boolean).join(', '),
    city:       sa.city ?? '',
    state:      sa.state ?? '',
    postalCode: sa.postalCode ?? sa.postCode ?? '',
    country:    sa.country ?? '',
  };

  const pm = raw.payment ?? raw.paymentDetails ?? {};
  const paymentDetails = {
    method:        pm.method ?? pm.paymentMethod ?? 'Card',
    status:        pm.status ?? 'Completed',
    transactionId: pm.transactionId ?? pm.reference,
    paidAt:        pm.paidAt ?? pm.createdAt,
  };

  return {
    id:             String(raw._id ?? raw.id),
    date:           raw.createdAt ?? raw.date ?? new Date().toISOString(),
    total:          Number(raw.total) || 0,
    status:         (raw.status ?? 'ordered') as Order['status'],
    items,
    shippingAddress,
    paymentDetails,
    tracking:       (raw.tracking ?? []).map((t: any) => ({
      status:    t.status ?? '',
      date:      t.date ?? t.updatedAt ?? '',
      location:  t.location ?? '',
      completed: Boolean(t.completed),
    })),
    history: (raw.history ?? []).map((h: any) => ({
      status:    h.status ?? '',
      updatedAt: h.updatedAt ?? '',
    })),
  };
}

export async function getOrder(orderId: string): Promise<Order> {
  const res = await apiClient.get(ENDPOINTS.orders.byId(orderId));
  return mapOrder(res.data.order ?? res.data);
}

export async function getUserOrders(
  userId: string,
  options: { page?: number; limit?: number; status?: string } = {}
): Promise<{ orders: Order[]; pages: number; total: number }> {
  const res = await apiClient.get(ENDPOINTS.orders.byUser(userId), {
    params: {
      page:   options.page  ?? 1,
      limit:  options.limit ?? 20,
      ...(options.status ? { status: options.status } : {}),
    },
  });
  const raw = res.data;
  const list: Order[] = (raw.orders ?? raw.data ?? []).map(mapOrder);
  return {
    orders: list,
    pages:  raw.pagination?.pages ?? raw.pages ?? 1,
    total:  raw.pagination?.total ?? raw.total ?? list.length,
  };
}

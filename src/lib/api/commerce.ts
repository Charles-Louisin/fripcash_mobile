import { api } from './client';
import type {
  Cart,
  Dispute,
  Favorite,
  LedgerEntry,
  Offer,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
  SalesChartPoint,
  WalletBalance,
} from './types';

export const fetchCart = () => api.get<Cart>('/cart');
export const clearCart = () => api.delete<Cart>('/cart');
export const addCartItem = (listingId: string, quantity: number) =>
  api.post<Cart>('/cart/items', { listingId, quantity });
export const updateCartItem = (id: string, quantity: number) =>
  api.patch<Cart>(`/cart/items/${id}`, { quantity });
export const removeCartItem = (id: string) => api.delete<Cart>(`/cart/items/${id}`);

export type CheckoutInput = {
  paymentMethod: PaymentMethod;
  address: string;
  city?: string;
  phone: string;
  name: string;
  email: string;
  mobileNumber?: string;
  fulfillmentMode?: 'courier' | 'pickup' | 'shopLocalDelivery';
  shippingCostGnf?: number;
  toZoneId?: string;
  offerAmountGnf?: number;
};

export const checkout = (body: CheckoutInput) =>
  api.post<{ payment: Payment; orders: Order[] }>('/checkout', body);
export const fetchPayment = (ref: string) =>
  api.get<{ payment: Payment; orders: Order[] }>(`/payments/${encodeURIComponent(ref)}`);

export const fetchPurchases = () => api.get<Order[]>('/orders/purchases');
export const fetchSales = () => api.get<Order[]>('/orders/sales');
export const fetchSalesChart = (days = 30) => api.get<SalesChartPoint[]>('/orders/sales-chart', { days });
export const fetchOrder = (id: string) => api.get<Order>(`/orders/${id}`);
export const transitionOrder = (id: string, status: OrderStatus, note?: string) =>
  api.patch<Order>(`/orders/${id}/status`, { status, note });
export const confirmReception = (id: string) => api.post<Order>(`/orders/${id}/confirm-reception`);
export const verifyOrderPickupCode = (id: string, code: string) =>
  api.post<Order>(`/orders/${id}/pickup-code/verify`, { code });
export const requestCourier = (id: string) => api.post<Order>(`/orders/${id}/request-courier`);
export const openDispute = (id: string, reason: string) =>
  api.post<{ id: string; status: string; reason: string }>(`/orders/${id}/disputes`, { reason });
export const reviewOrder = (id: string, body: { rating: number; comment?: string; listingId: string }) =>
  api.post<{ id: string; rating: number }>(`/orders/${id}/reviews`, body);
export const sellerRefund = (id: string) => api.post<Order>(`/orders/${id}/seller-refund`, { amount: 'full' });
export const acceptOrderOffer = (id: string) => api.post<Order>(`/orders/${id}/offer/accept`);
export const refuseOrderOffer = (id: string) => api.post<Order>(`/orders/${id}/offer/refuse`);
export const payFullAfterRefuse = (id: string) => api.post<Order>(`/orders/${id}/offer/pay-full`);
export const cancelAfterRefuse = (id: string) => api.post<Order>(`/orders/${id}/offer/cancel`);

export const fetchMyOffers = () => api.get<Offer[]>('/offers/mine');
export const createOffer = (listingId: string, amountGnf: number, message?: string) =>
  api.post<{ id: string; status: string; amountGnf: number }>(`/offers/listings/${listingId}`, {
    amountGnf,
    message,
  });
export const acceptOffer = (id: string) => api.patch<{ id: string; status: string }>(`/offers/${id}/accept`);
export const refuseOffer = (id: string) => api.patch<{ id: string; status: string }>(`/offers/${id}/refuse`);

export const fetchFavorites = () => api.get<Favorite[]>('/favorites');
export const addFavorite = (listingId: string) => api.post(`/favorites/${listingId}`);
export const removeFavorite = (listingId: string) => api.delete(`/favorites/${listingId}`);

export const fetchDisputes = () => api.get<Dispute[]>('/disputes');
export const addDisputeEvidence = (id: string, url: string, storageKey?: string, uploaderRole?: string) =>
  api.post(`/disputes/${id}/evidence`, { url, storageKey, uploaderRole });
export const addDisputeMessage = (
  id: string,
  body: string,
  attachments?: { url: string; storageKey?: string; mimeType?: string; name?: string }[]
) => api.post<Dispute>(`/disputes/${id}/messages`, { body, attachments });
export const fetchDispute = (id: string) => api.get<Dispute>(`/disputes/${id}`);
export const releaseDisputeToSeller = (id: string) => api.post<Dispute>(`/disputes/${id}/release`);
export const refundDisputeToBuyer = (id: string) => api.post<Dispute>(`/disputes/${id}/refund`);
export const splitDispute = (id: string, buyerPercent: number, note?: string) =>
  api.post<Dispute>(`/disputes/${id}/split`, { buyerPercent, note });
export const closeDispute = (id: string) => api.post(`/disputes/${id}/close`);
export const reopenDispute = (id: string) => api.post(`/disputes/${id}/reopen`);

export const fetchWalletBalance = () => api.get<WalletBalance>('/wallet/balance');
export const fetchWalletLedger = () => api.get<{ items: LedgerEntry[] }>('/wallet/ledger');
export const requestWithdraw = (amountGnf: number, phone: string) =>
  api.post<{ status: string; amountGnf: number; merchantTransactionId: string; message: string }>(
    '/wallet/withdraw',
    { amountGnf, phone }
  );

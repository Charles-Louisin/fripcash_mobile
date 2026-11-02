import { api } from './client';

export type PayoutStatus = 'blocked' | 'eligible' | 'queued' | 'processing' | 'succeeded' | 'failed' | 'unknown' | 'cancelled';

export type AdminPayout = {
  id: string;
  payoutReference: string;
  parentOrderId: string;
  sellerOrderId: string | null;
  deliveryId: string | null;
  refundId: string | null;
  beneficiaryType: 'seller' | 'courier' | 'buyer';
  beneficiaryId: string;
  destination: { operator: string; channel: string; phoneNumber: string; accountName: string };
  amount: number;
  currency: string;
  status: PayoutStatus;
  providerPayoutId: string;
  attemptsCount: number;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  failureCode: string;
  failureMessage: string;
  completedAt: string | null;
  batchId: string | null;
  retryable: boolean;
  createdAt: string;
  updatedAt: string;
  history?: { status: string; at: string; note?: string }[];
};

export type PayoutAttempt = {
  id: string;
  attemptNumber: number;
  attemptReference: string;
  providerReference: string;
  status: 'created' | 'processing' | 'succeeded' | 'failed' | 'unknown';
  failureCode: string;
  failureMessage: string;
  startedAt: string;
  completedAt: string | null;
};

export type AdminPayoutDetail = {
  payout: AdminPayout;
  attempts: PayoutAttempt[];
  allocation: { status: string; amount: number; refundedAmount: number; hold?: { active: boolean; reason: string } } | null;
  webhooks: { eventKey: string; statusCode: string; receivedAt: string; duplicates: number }[];
};

export type ReconciliationReport = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  checkedAt?: string;
  issues: { kind: string; severity: string; targetType: string; targetId: string; detail: string }[];
};

/** Les actions qui déclenchent un transfert exigent le mot de passe admin (authentification renforcée). */
const stepUp = (password: string) => ({ headers: { 'X-Admin-Password': password } });

export const fetchAdminPayouts = (params: { status?: string; beneficiaryType?: string; page?: number } = {}) =>
  api.get<{ page: number; items: AdminPayout[] }>('/admin/payouts', params);
export const fetchAdminPayout = (id: string) => api.get<AdminPayoutDetail>(`/admin/payouts/${id}`);
export const retryAdminPayout = (id: string, password: string) =>
  api.post<{ alreadySucceeded: boolean; payout: AdminPayout | null }>(`/admin/payouts/${id}/retry`, {}, stepUp(password));
export const resolveUnknownPayout = (id: string, outcome: 'succeeded' | 'failed', note: string, password: string) =>
  api.post<AdminPayout>(`/admin/payouts/${id}/resolve-unknown`, { outcome, note }, stepUp(password));
export const blockAdminPayout = (id: string, reason: string, password: string) =>
  api.post<AdminPayout>(`/admin/payouts/${id}/block`, { reason }, stepUp(password));
export const unblockAdminPayout = (id: string, reason: string, password: string) =>
  api.post<AdminPayout>(`/admin/payouts/${id}/unblock`, { reason }, stepUp(password));
export const executePayoutBatch = (password: string, payoutIds?: string[]) =>
  api.post<{ id: string; batchReference: string; status: string; count: number; totalAmount: number }>(
    '/admin/payouts/execute-batch',
    { payoutIds },
    stepUp(password),
  );
export const fetchReconciliationReports = () => api.get<ReconciliationReport[]>('/admin/finance/reconciliation');
export const runReconciliation = () =>
  api.post<{ checkedAt: string; issues: ReconciliationReport['issues'] }>('/admin/finance/reconciliation/run');

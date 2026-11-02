import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ChipRow,
  EmptyState,
  ErrorState,
  Input,
  Screen,
  ScreenHeader,
  Sheet,
  Skeleton,
  toast,
  Txt,
  type Tone,
} from '@/components/ui';
import {
  blockAdminPayout,
  errorMessage,
  executePayoutBatch,
  fetchAdminPayout,
  fetchAdminPayouts,
  fetchReconciliationReports,
  resolveUnknownPayout,
  retryAdminPayout,
  runReconciliation,
  unblockAdminPayout,
  type AdminPayout,
  type PayoutStatus,
} from '@/lib/api';
import { formatGnf, formatRelative } from '@/lib/format';
import { colors, radius } from '@/theme';

type Filter = 'all' | PayoutStatus;

const STATUS: Record<PayoutStatus, { label: string; tone: Tone }> = {
  succeeded: { label: 'Réussi', tone: 'success' },
  failed: { label: 'Échoué', tone: 'danger' },
  unknown: { label: 'Inconnu — à vérifier', tone: 'warning' },
  processing: { label: 'En cours', tone: 'primary' },
  queued: { label: 'En file', tone: 'neutral' },
  eligible: { label: 'À lancer', tone: 'neutral' },
  blocked: { label: 'Bloqué', tone: 'warning' },
  cancelled: { label: 'Annulé', tone: 'neutral' },
};

const BENEFICIARY: Record<AdminPayout['beneficiaryType'], string> = {
  seller: 'Vendeur',
  courier: 'Livreur',
  buyer: 'Remboursement client',
};

const FAILURE_LABELS: Record<string, string> = {
  PUSH_DISABLED: 'Le service PUSH n’est pas activé sur le compte Chap Chap Pay.',
  PROVIDER_CONFIG: 'Reversements non configurés (code d’agent PUSH manquant).',
  INSUFFICIENT_BALANCE: 'Solde du compte marchand insuffisant.',
  BALANCE_CHECK_FAILED: 'Solde du compte marchand momentanément illisible.',
  DESTINATION_INVALID: 'Aucun numéro Mobile Money valide pour ce bénéficiaire.',
  BELOW_MINIMUM: 'Montant inférieur au minimum de reversement.',
  DISPUTE: 'Bloqué par un litige.',
  ADMIN_HOLD: 'Bloqué par un administrateur.',
  PROVIDER_ERROR: 'Transfert refusé par l’opérateur.',
  PROVIDER_REJECTED: 'Requête refusée par Chap Chap Pay.',
  NOT_SENT: 'Chap Chap Pay injoignable : rien n’a été envoyé.',
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'failed', label: 'Échoués' },
  { value: 'unknown', label: 'Inconnus' },
  { value: 'blocked', label: 'Bloqués' },
  { value: 'eligible', label: 'À lancer' },
  { value: 'processing', label: 'En cours' },
  { value: 'succeeded', label: 'Réussis' },
];

/** Action sensible : exécutée seulement après saisie du mot de passe administrateur. */
type PendingAction = {
  title: string;
  message: string;
  needsNote?: boolean;
  danger?: boolean;
  run: (password: string, note: string) => Promise<unknown>;
};

export default function AdminPayouts() {
  const client = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<PendingAction | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'payouts', filter],
    queryFn: () => fetchAdminPayouts(filter === 'all' ? {} : { status: filter }),
    refetchInterval: 15_000,
  });
  const reports = useQuery({ queryKey: ['admin', 'reconciliation'], queryFn: fetchReconciliationReports });
  const rows = list.data?.items ?? [];
  const lastReport = reports.data?.[0];

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    client.invalidateQueries({ queryKey: ['admin', 'payout'] });
  };

  const reconcile = useMutation({
    mutationFn: runReconciliation,
    onSuccess: (r) => {
      toast.success(r.issues.length ? `${r.issues.length} point(s) à examiner` : 'Aucun écart détecté');
      client.invalidateQueries({ queryKey: ['admin', 'reconciliation'] });
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const askBatch = () =>
    setAction({
      title: 'Lancer les reversements en attente',
      message:
        'Chaque reversement « À lancer » part en transfert individuel et garde son propre statut. Un échec n’affecte pas les autres.',
      run: async (password) => {
        const batch = await executePayoutBatch(password);
        toast.success(`${batch.count} reversement(s) lancés · ${formatGnf(batch.totalAmount)}`);
      },
    });

  return (
    <Screen refreshing={list.isRefetching} onRefresh={() => list.refetch()}>
      <ScreenHeader title="Reversements" subtitle="Vendeurs, livreurs et remboursements · Chap Chap Pay" />

      <Card style={styles.summary}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">Réconciliation</Txt>
          <Txt variant="caption">
            {lastReport
              ? `${formatRelative(lastReport.createdAt)} · ${lastReport.issues?.length ? `${lastReport.issues.length} écart(s)` : 'aucun écart'}`
              : 'Pas encore exécutée'}
          </Txt>
        </View>
        <Button title="Vérifier" size="sm" variant="outline" onPress={() => reconcile.mutate()} loading={reconcile.isPending} />
      </Card>
      {lastReport?.issues?.length ? (
        <Card style={{ marginBottom: 12, gap: 6, backgroundColor: colors.primarySoft }}>
          {lastReport.issues.slice(0, 4).map((i, idx) => (
            <Txt key={`${i.kind}-${idx}`} variant="caption">
              {i.severity === 'critical' ? '⚠︎ ' : '• '}
              {i.detail}
            </Txt>
          ))}
        </Card>
      ) : null}

      <ChipRow options={FILTERS} value={filter} onChange={setFilter} />
      {filter === 'eligible' && rows.length ? (
        <Button title={`Lancer ${rows.length} reversement(s)`} onPress={askBatch} full style={{ marginTop: 12 }} />
      ) : null}
      <View style={{ height: 12 }} />

      {list.isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} radius={radius.lg} />
          ))}
        </View>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon="wallet-outline" title="Aucun reversement" message="Ils apparaissent après la confirmation de réception d’un colis." />
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Reversement ${p.payoutReference}`}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.row}>
                  <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {BENEFICIARY[p.beneficiaryType]} · {p.destination.accountName || p.destination.phoneNumber || '—'}
                  </Txt>
                  <Txt variant="bodyStrong">{formatGnf(p.amount)}</Txt>
                </View>
                <Txt variant="small" numberOfLines={1}>
                  {p.payoutReference} · {formatRelative(p.updatedAt)}
                </Txt>
                <View style={[styles.row, { gap: 6, marginTop: 2 }]}>
                  <Badge label={STATUS[p.status].label} tone={STATUS[p.status].tone} />
                  {p.attemptsCount > 1 ? <Badge label={`${p.attemptsCount} tentatives`} tone="neutral" /> : null}
                  {p.failureCode ? <Badge label={p.failureCode} tone="neutral" /> : null}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <PayoutSheet id={selected} onClose={() => setSelected(null)} onAction={setAction} />
      <StepUpSheet
        action={action}
        onClose={() => setAction(null)}
        onDone={() => {
          setAction(null);
          refresh();
        }}
      />
    </Screen>
  );
}

function PayoutSheet({
  id,
  onClose,
  onAction,
}: {
  id: string | null;
  onClose: () => void;
  onAction: (a: PendingAction) => void;
}) {
  const detail = useQuery({
    queryKey: ['admin', 'payout', id],
    queryFn: () => fetchAdminPayout(id!),
    enabled: !!id,
  });
  const p = detail.data?.payout;

  const act = (a: PendingAction) => {
    onClose();
    onAction(a);
  };

  return (
    <Sheet visible={!!id} onClose={onClose} title="Reversement" icon="wallet-outline">
      {!p ? (
        <Skeleton height={160} radius={radius.lg} />
      ) : (
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
          <View style={styles.row}>
            <Txt variant="h2" style={{ flex: 1 }}>
              {formatGnf(p.amount)}
            </Txt>
            <Badge label={STATUS[p.status].label} tone={STATUS[p.status].tone} />
          </View>
          <Txt variant="caption">
            {BENEFICIARY[p.beneficiaryType]} · {p.destination.accountName || '—'} · {p.destination.phoneNumber} (
            {p.destination.channel === 'orange_money' ? 'Orange Money' : p.destination.channel === 'mtn_momo' ? 'MTN MoMo' : p.destination.channel})
          </Txt>
          <Txt variant="small">{p.payoutReference}</Txt>
          {p.failureCode || p.failureMessage ? (
            <Card style={{ backgroundColor: colors.primarySoft, gap: 2 }}>
              <Txt variant="caption">{FAILURE_LABELS[p.failureCode] || p.failureMessage || p.failureCode}</Txt>
              {p.failureMessage && FAILURE_LABELS[p.failureCode] ? <Txt variant="small">{p.failureMessage}</Txt> : null}
              {p.status === 'queued' && p.nextRetryAt ? (
                <Txt variant="small">
                  Nouvel essai automatique à{' '}
                  {new Date(p.nextRetryAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Txt>
              ) : null}
            </Card>
          ) : null}
          {detail.data?.allocation?.hold?.active ? (
            <Txt variant="caption">Somme bloquée : {detail.data.allocation.hold.reason}</Txt>
          ) : null}

          <Txt variant="h3">Tentatives</Txt>
          {detail.data?.attempts.length ? (
            detail.data.attempts.map((a) => (
              <View key={a.id} style={styles.attempt}>
                <View style={styles.row}>
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>
                    Tentative {a.attemptNumber}
                  </Txt>
                  <Txt variant="caption">{a.status}</Txt>
                </View>
                <Txt variant="small">
                  {formatRelative(a.startedAt)}
                  {a.failureMessage ? ` · ${a.failureMessage}` : ''}
                </Txt>
              </View>
            ))
          ) : (
            <Txt variant="caption">Aucun transfert envoyé pour l’instant.</Txt>
          )}

          <View style={{ gap: 8, marginTop: 4 }}>
            {p.status === 'failed' ? (
              <Button
                title="Relancer uniquement ce reversement"
                full
                onPress={() =>
                  act({
                    title: 'Relancer ce reversement',
                    message: `Une nouvelle tentative de ${formatGnf(p.amount)} sera envoyée à ce seul bénéficiaire. Les autres reversements ne sont pas touchés.`,
                    run: async (password) => {
                      const r = await retryAdminPayout(p.id, password);
                      toast.success(r.alreadySucceeded ? 'Le transfert précédent avait finalement réussi.' : 'Relance programmée');
                    },
                  })
                }
              />
            ) : null}
            {p.status === 'unknown' || p.status === 'processing' ? (
              <>
                <Txt variant="caption">
                  Le prestataire n’a pas confirmé ce transfert. Vérifie dans le tableau de bord Chap Chap Pay avant de trancher.
                </Txt>
                <Button
                  title="Confirmé reçu chez Chap Chap Pay"
                  variant="outline"
                  full
                  onPress={() =>
                    act({
                      title: 'Marquer comme réussi',
                      message: 'Indique la référence ou la preuve consultée dans le tableau de bord.',
                      needsNote: true,
                      run: (password, note) => resolveUnknownPayout(p.id, 'succeeded', note, password),
                    })
                  }
                />
                <Button
                  title="Non exécuté chez Chap Chap Pay"
                  variant="outline"
                  full
                  onPress={() =>
                    act({
                      title: 'Marquer comme non exécuté',
                      message: 'Le reversement passera en échec et pourra être relancé. Indique la preuve consultée.',
                      needsNote: true,
                      danger: true,
                      run: (password, note) => resolveUnknownPayout(p.id, 'failed', note, password),
                    })
                  }
                />
              </>
            ) : null}
            {['eligible', 'queued', 'failed'].includes(p.status) ? (
              <Button
                title="Bloquer"
                variant="ghost"
                full
                onPress={() =>
                  act({
                    title: 'Bloquer ce reversement',
                    message: 'Il ne partira plus tant qu’il n’est pas débloqué.',
                    needsNote: true,
                    danger: true,
                    run: (password, note) => blockAdminPayout(p.id, note, password),
                  })
                }
              />
            ) : null}
            {p.status === 'blocked' && ['ADMIN_HOLD', 'BELOW_MINIMUM'].includes(p.failureCode) ? (
              <Button
                title="Débloquer"
                variant="outline"
                full
                onPress={() =>
                  act({
                    title: 'Débloquer ce reversement',
                    message: 'Il repartira selon le mode de reversement configuré.',
                    needsNote: true,
                    run: (password, note) => unblockAdminPayout(p.id, note, password),
                  })
                }
              />
            ) : null}
          </View>
        </ScrollView>
      )}
    </Sheet>
  );
}

function StepUpSheet({ action, onClose, onDone }: { action: PendingAction | null; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => {
    setPassword('');
    setNote('');
    onClose();
  };

  const confirm = async () => {
    if (!action) return;
    if (!password) return toast.error('Saisis ton mot de passe administrateur.');
    if (action.needsNote && note.trim().length < 10) return toast.error('Explique la raison (10 caractères minimum).');
    setLoading(true);
    try {
      await action.run(password, note.trim());
      setPassword('');
      setNote('');
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet visible={!!action} onClose={close} title={action?.title} icon="lock-closed-outline">
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Txt variant="caption">{action?.message}</Txt>
        {action?.needsNote ? (
          <Input label="Motif / preuve" value={note} onChangeText={setNote} multiline placeholder="Référence, capture, raison…" />
        ) : null}
        <Input
          label="Mot de passe administrateur"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          hint="Requis pour toute opération qui déplace de l’argent."
        />
        <Button title="Confirmer" variant={action?.danger ? 'danger' : 'primary'} onPress={confirm} loading={loading} full />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  card: {
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  attempt: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    gap: 2,
  },
});

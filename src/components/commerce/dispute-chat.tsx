import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Chip,
  ConfirmDialog,
  ErrorState,
  IconButton,
  Input,
  LazyMount,
  PageSkeleton,
  Sheet,
  toast,
  Txt,
} from '@/components/ui';
import { qk, useDispute } from '@/hooks/queries';
import {
  addDisputeMessage,
  errorMessage,
  mediaUrl,
  pickKycFiles,
  refundDisputeToBuyer,
  releaseDisputeToSeller,
  splitDispute,
  uploadDocumentAsset,
  type Dispute,
  type DisputeMessage,
  type DisputeRole,
} from '@/lib/api';
import { formatGnf, formatTime, shortOrderId } from '@/lib/format';
import { useKeyboardSpace } from '@/lib/keyboard-space';
import { colors, fonts, radius } from '@/theme';

type Attachment = { url: string; storageKey?: string; mimeType?: string; name?: string };

type FeedItem =
  | { kind: 'opened'; id: string; at: string }
  | { kind: 'msg'; id: string; at: string; m: DisputeMessage; mine: boolean }
  | { kind: 'decision'; id: string; at: string; m: DisputeMessage }
  | { kind: 'actions'; id: string; at: string };

const STATUS: Record<Dispute['status'], { label: string; tone: 'warning' | 'primary' | 'success' | 'neutral' }> = {
  open: { label: 'Ouvert', tone: 'warning' },
  under_review: { label: 'En examen', tone: 'primary' },
  resolved: { label: 'Résolu', tone: 'success' },
  closed: { label: 'Clos', tone: 'neutral' },
};

const ROLE_LABEL: Record<DisputeRole, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  admin: 'Équipe FripCash',
};

const PRESETS = [0, 25, 50, 75, 100];

function isPdf(a: Attachment) {
  return (a.mimeType || '').includes('pdf') || /\.pdf($|\?)/i.test(a.name || a.url);
}

function openFile(url: string) {
  const target = mediaUrl(url) || url;
  WebBrowser.openBrowserAsync(target).catch(() => toast.error('Impossible d’ouvrir le fichier.'));
}

function resolutionText(d: Dispute) {
  if (d.resolution === 'refund_buyer') return 'L’acheteur est remboursé.';
  if (d.resolution === 'release_seller') return 'Le vendeur est payé.';
  if (d.resolution === 'partial_refund') {
    const p = d.buyerPercent ?? 50;
    return `Montant partagé : ${p} % acheteur, ${100 - p} % vendeur.`;
  }
  return 'Le litige est tranché.';
}

/** Fil de résolution d'un litige entre l'acheteur, le vendeur et l'équipe FripCash. */
export function DisputeChat({ id }: { id: string }) {
  const client = useQueryClient();
  const q = useDispute(id, 5_000);
  const d = q.data;
  const listRef = useRef<FlatList>(null);
  const keyboardSpace = useKeyboardSpace();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'release' | 'refund' | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [buyerPercent, setBuyerPercent] = useState(50);
  const [splitNote, setSplitNote] = useState('');

  const role = d?.viewerRole ?? null;
  const resolved = d?.status === 'resolved';

  const feed = useMemo<FeedItem[]>(() => {
    if (!d) return [];
    const items: FeedItem[] = [{ kind: 'opened', id: 'opened', at: d.createdAt }];
    d.messages.forEach((m, i) => {
      const key = m.id ?? `m-${i}`;
      if (m.kind === 'decision') items.push({ kind: 'decision', id: key, at: m.createdAt, m });
      else items.push({ kind: 'msg', id: key, at: m.createdAt, m, mine: m.senderId === d.currentUserId });
    });
    items.push({ kind: 'actions', id: 'actions', at: new Date(8.64e15).toISOString() });
    return items;
  }, [d]);

  const refresh = () => {
    client.invalidateQueries({ queryKey: qk.disputes });
    client.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    client.invalidateQueries({ queryKey: ['admin', 'stats'] });
    if (d) {
      client.invalidateQueries({ queryKey: qk.order(d.orderId) });
      client.invalidateQueries({ queryKey: qk.purchases });
      client.invalidateQueries({ queryKey: qk.sales });
    }
  };

  const attach = async () => {
    try {
      const assets = await pickKycFiles({ multiple: true });
      if (!assets.length) return;
      setUploading(true);
      const uploaded: Attachment[] = [];
      for (const asset of assets.slice(0, 6)) {
        const up = await uploadDocumentAsset(asset, 'disputes');
        uploaded.push({ url: up.url, storageKey: up.publicId, mimeType: up.mimeType, name: up.name });
      }
      setFiles((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!d || (!text.trim() && !files.length)) return;
    setSending(true);
    try {
      const fresh = await addDisputeMessage(d.id, text.trim(), files);
      client.setQueryData(qk.dispute(d.id), fresh);
      setText('');
      setFiles([]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const decide = async (fn: () => Promise<Dispute>, ok: string) => {
    if (!d) return;
    setBusy(true);
    try {
      const fresh = await fn();
      client.setQueryData(qk.dispute(d.id), fresh);
      refresh();
      toast.success(ok);
      setConfirm(null);
      setSplitOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <PageSkeleton kind="chat" />
      </SafeAreaView>
    );
  }
  if (!d) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ErrorState error={q.error ?? new Error('Litige introuvable')} onRetry={() => q.refetch()} />
      </SafeAreaView>
    );
  }

  const status = STATUS[d.status];
  const net = d.netGnf || d.amountGnf || 0;
  const buyerShare = Math.round((net * buyerPercent) / 100);
  const image = mediaUrl(d.productImage);

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.kind === 'opened') {
      return (
        <View style={styles.event}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">
              Litige ouvert par {d.openerRole === 'seller' ? d.sellerName : d.buyerName}
            </Txt>
            <Txt variant="caption">{d.reason}</Txt>
            <Txt variant="small" style={{ marginTop: 2 }}>
              Les fonds restent bloqués en séquestre jusqu’à la décision.
            </Txt>
          </View>
        </View>
      );
    }
    if (item.kind === 'decision') {
      return (
        <View style={[styles.event, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">Décision</Txt>
            <Txt variant="caption" color={colors.text}>
              {item.m.body}
            </Txt>
            <Txt variant="small">{formatTime(item.at)}</Txt>
          </View>
        </View>
      );
    }
    if (item.kind === 'msg') {
      const m = item.m;
      const fromAdmin = m.fromAdmin || m.senderRole === 'admin';
      const bubbleStyle = item.mine ? styles.mine : fromAdmin ? styles.admin : styles.theirs;
      const fg = item.mine || fromAdmin ? colors.white : colors.text;
      const sub = item.mine || fromAdmin ? colors.onDarkMuted : colors.textSubtle;
      return (
        <View style={[styles.bubble, bubbleStyle]}>
          {!item.mine ? (
            <Txt variant="small" color={fromAdmin ? colors.onDarkMuted : colors.primary} weight="bold">
              {fromAdmin ? 'Équipe FripCash' : `${m.senderName} · ${ROLE_LABEL[(m.senderRole as DisputeRole) || 'buyer']}`}
            </Txt>
          ) : null}
          {m.body ? (
            <Txt variant="body" color={fg}>
              {m.body}
            </Txt>
          ) : null}
          {m.attachments?.length ? (
            <View style={styles.files}>
              {m.attachments.map((a, i) =>
                isPdf(a) ? (
                  <Pressable key={`${a.url}-${i}`} onPress={() => openFile(a.url)} style={styles.pdf}>
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    <Txt variant="caption" color={colors.text} numberOfLines={1} style={{ flex: 1 }}>
                      {a.name || 'Document PDF'}
                    </Txt>
                  </Pressable>
                ) : (
                  <Pressable key={`${a.url}-${i}`} onPress={() => openFile(a.url)}>
                    <Image source={{ uri: mediaUrl(a.url) || a.url }} style={styles.thumb} contentFit="cover" />
                  </Pressable>
                )
              )}
            </View>
          ) : null}
          <Txt variant="small" color={sub} style={{ alignSelf: 'flex-end' }}>
            {formatTime(m.createdAt)}
          </Txt>
        </View>
      );
    }
    if (resolved) {
      return (
        <View style={styles.action}>
          <Badge label="Litige résolu" tone="success" icon="checkmark-circle" />
          <Txt variant="body">{resolutionText(d)}</Txt>
        </View>
      );
    }
    if (!role) return null;
    return (
      <View style={styles.action}>
        <Txt variant="h3">Régler le litige</Txt>
        <Txt variant="caption">
          {formatGnf(net)} sont bloqués en séquestre.{' '}
          {role === 'buyer'
            ? 'Si le souci est réglé, tu peux payer le vendeur.'
            : role === 'seller'
              ? 'Si l’acheteur a raison, tu peux le rembourser.'
              : 'Tranche en faveur d’une partie ou partage le montant.'}
        </Txt>
        {role === 'buyer' || role === 'admin' ? (
          <Button title="Payer le vendeur" icon="cash-outline" onPress={() => setConfirm('release')} disabled={busy} full />
        ) : null}
        {role === 'seller' || role === 'admin' ? (
          <Button
            title="Rembourser l’acheteur"
            icon="return-down-back-outline"
            variant={role === 'admin' ? 'secondary' : 'danger'}
            onPress={() => setConfirm('refund')}
            disabled={busy}
            full
          />
        ) : null}
        {role === 'admin' ? (
          <Button title="Partager le montant" icon="git-compare-outline" variant="outline" onPress={() => setSplitOpen(true)} disabled={busy} full />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LazyMount kind="chat">
        <View style={{ flex: 1, paddingBottom: keyboardSpace }}>
          <View style={styles.header}>
            <IconButton icon="chevron-back" label="Retour" background={colors.white} onPress={() => router.back()} />
            <View style={styles.headIcon}>
              <Ionicons name="shield-half-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="title" numberOfLines={1}>
                Litige · {d.productTitle || 'Commande'}
              </Txt>
              <Txt variant="caption" numberOfLines={1}>
                {d.buyerName} · {d.sellerName} · Équipe FripCash
              </Txt>
            </View>
          </View>

          <View style={styles.pin}>
            {image ? <Image source={{ uri: image }} style={styles.pinImg} contentFit="cover" /> : <View style={styles.pinImg} />}
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {d.productTitle} · {formatGnf(d.amountGnf)}
              </Txt>
              <Txt variant="caption">
                {shortOrderId(d.orderId)}
                {role ? ` · Tu es ${role === 'admin' ? 'admin' : ROLE_LABEL[role].toLowerCase()}` : ''}
              </Txt>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Badge label={status.label} tone={status.tone} />
                {role !== 'admin' ? (
                  <Pressable onPress={() => router.push({ pathname: '/commandes/[id]', params: { id: d.orderId } })}>
                    <Badge label="Voir la commande" tone="neutral" icon="open-outline" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={feed}
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={renderItem}
          />

          {!resolved && role ? (
            <View>
              {files.length ? (
                <View style={styles.pending}>
                  {files.map((f, i) => (
                    <View key={`${f.url}-${i}`} style={styles.pendingItem}>
                      {isPdf(f) ? (
                        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                      ) : (
                        <Image source={{ uri: mediaUrl(f.url) || f.url }} style={styles.pendingImg} contentFit="cover" />
                      )}
                      <Pressable
                        onPress={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        style={styles.pendingRemove}
                        accessibilityLabel="Retirer">
                        <Ionicons name="close" size={12} color={colors.white} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.composer}>
                <Pressable onPress={attach} disabled={uploading} style={styles.attach} accessibilityLabel="Joindre une image ou un PDF">
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="attach" size={22} color={colors.primary} />
                  )}
                </Pressable>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Écrire un message…"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                  multiline
                />
                <Pressable
                  onPress={send}
                  disabled={sending || uploading || (!text.trim() && !files.length)}
                  style={[styles.send, (sending || (!text.trim() && !files.length)) && { opacity: 0.5 }]}
                  accessibilityLabel="Envoyer">
                  {sending ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <ConfirmDialog
          visible={confirm === 'release'}
          onClose={() => setConfirm(null)}
          title="Payer le vendeur ?"
          message={`Les ${formatGnf(net)} bloqués en séquestre seront versés à ${d.sellerName}. Le litige sera clos.`}
          confirmLabel="Oui, payer"
          icon="cash-outline"
          loading={busy}
          onConfirm={() => decide(() => releaseDisputeToSeller(d.id), 'Vendeur payé')}
        />
        <ConfirmDialog
          visible={confirm === 'refund'}
          onClose={() => setConfirm(null)}
          title="Rembourser l’acheteur ?"
          message={`Les ${formatGnf(net)} bloqués en séquestre seront renvoyés à ${d.buyerName}. Le litige sera clos.`}
          confirmLabel="Oui, rembourser"
          tone="danger"
          icon="return-down-back-outline"
          loading={busy}
          onConfirm={() => decide(() => refundDisputeToBuyer(d.id), 'Acheteur remboursé')}
        />

        <Sheet visible={splitOpen} onClose={() => setSplitOpen(false)} title="Partager le montant" icon="git-compare-outline">
          <View style={{ gap: 14 }}>
            <Txt variant="caption">Choisis la part de chacun sur les {formatGnf(net)} en séquestre.</Txt>
            <View style={styles.splitRow}>
              <View style={styles.splitSide}>
                <Txt variant="small">Acheteur</Txt>
                <Txt style={styles.splitPct}>{buyerPercent} %</Txt>
                <Txt variant="caption">{formatGnf(buyerShare)}</Txt>
              </View>
              <View style={styles.stepper}>
                <IconButton icon="remove" label="Moins pour l’acheteur" onPress={() => setBuyerPercent((p) => Math.max(0, p - 5))} />
                <IconButton icon="add" label="Plus pour l’acheteur" onPress={() => setBuyerPercent((p) => Math.min(100, p + 5))} />
              </View>
              <View style={[styles.splitSide, { alignItems: 'flex-end' }]}>
                <Txt variant="small">Vendeur</Txt>
                <Txt style={styles.splitPct}>{100 - buyerPercent} %</Txt>
                <Txt variant="caption">{formatGnf(net - buyerShare)}</Txt>
              </View>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { flex: buyerPercent }]} />
              <View style={{ flex: 100 - buyerPercent }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PRESETS.map((p) => (
                <Chip key={p} label={`${p} / ${100 - p}`} active={buyerPercent === p} onPress={() => setBuyerPercent(p)} />
              ))}
            </View>
            <Input value={splitNote} onChangeText={setSplitNote} placeholder="Motif de la décision (optionnel)" multiline />
            <Button
              title="Valider le partage"
              loading={busy}
              onPress={() => decide(() => splitDispute(d.id, buyerPercent, splitNote.trim() || undefined), 'Montant partagé')}
              full
            />
          </View>
        </Sheet>
      </LazyMount>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pinImg: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  bubble: { maxWidth: '84%', padding: 12, borderRadius: 16, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  admin: { alignSelf: 'flex-start', backgroundColor: colors.dark, borderBottomLeftRadius: 4 },
  files: { gap: 6, marginTop: 2 },
  thumb: { width: 180, height: 140, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  pdf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    minWidth: 180,
  },
  event: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    alignItems: 'flex-start',
  },
  action: {
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  pending: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  pendingItem: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingImg: { width: 52, height: 52, borderRadius: radius.md },
  pendingRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  attach: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitSide: { flex: 1, gap: 2 },
  splitPct: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  stepper: { flexDirection: 'row', gap: 4 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.primarySoft },
  barFill: { backgroundColor: colors.primary },
});

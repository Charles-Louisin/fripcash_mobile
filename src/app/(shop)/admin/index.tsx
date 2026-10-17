import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AreaChart, bucket, CHART_COLORS, DonutChart } from '@/components/admin/admin-charts';
import { AdminStatCard, STAT_CARD_WIDTH } from '@/components/admin/stat-card';
import { Badge, BarChart, Button, Card, ErrorState, Screen, ScreenHeader, Segmented, Skeleton, Txt } from '@/components/ui';
import { fetchAdminStats, listingImages } from '@/lib/api';
import { formatGnf, formatNumber } from '@/lib/format';
import { colors, fonts } from '@/theme';

const RANGES = [
  { value: '7', label: '7 j' },
  { value: '30', label: '30 j' },
  { value: '90', label: '90 j' },
  { value: '365', label: '12 mois' },
] as const;

type RangeValue = (typeof RANGES)[number]['value'];

const RANGE_LABEL: Record<RangeValue, string> = {
  '7': '7 derniers jours',
  '30': '30 derniers jours',
  '90': '90 derniers jours',
  '365': '12 derniers mois',
};

const GAP = 12;

const LISTING_STATUS_FR: Record<string, string> = {
  DRAFT: 'Brouillon à valider',
  FLAGGED: 'Signalé',
  ACTIVE: 'En ligne',
  ARCHIVED: 'Retiré',
  REJECTED: 'Refusé',
  SOLD: 'Vendu',
};

function Carousel({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={STAT_CARD_WIDTH + GAP}
      style={styles.bleed}
      contentContainerStyle={styles.carousel}>
      {children}
    </ScrollView>
  );
}

function SectionCard({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <View style={styles.sectionHead}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{title}</Txt>
          {description ? <Txt variant="small">{description}</Txt> : null}
        </View>
        {right}
      </View>
      {children}
    </Card>
  );
}

function SeeAll({ href }: { href: Href }) {
  return (
    <Pressable onPress={() => router.push(href)} hitSlop={6} style={{ marginTop: 10 }}>
      <Txt style={styles.seeAll}>Voir tout ›</Txt>
    </Pressable>
  );
}

export default function AdminHome() {
  const [range, setRange] = useState<RangeValue>('30');
  const [audience, setAudience] = useState<'acheteurs' | 'vendeurs'>('acheteurs');
  const days = Number(range);
  const stats = useQuery({ queryKey: ['admin', 'stats', days], queryFn: () => fetchAdminStats(days), staleTime: 60_000 });
  const data = stats.data;

  const transactions = bucket(data?.chart?.transactions ?? [], ['revenus', 'commissions']);
  const inscriptions = bucket(data?.chart?.inscriptions ?? [], ['acheteurs', 'vendeurs']);
  const signupTotal = inscriptions.reduce((s, r) => s + (r[audience] || 0), 0);
  const categories = (data?.categoryChart ?? [])
    .slice()
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map((c, i) => ({ label: c.category, value: c.volume, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const categoryTotal = categories.reduce((s, c) => s + c.value, 0);
  const deliveryMix = [
    { label: 'Livraison', value: data?.gmvCourier ?? 0, color: colors.primary },
    { label: 'Retrait', value: data?.gmvPickup ?? 0, color: colors.gold },
  ];

  return (
    <Screen refreshing={stats.isRefetching} onRefresh={() => stats.refetch()}>
      <ScreenHeader title="Vue d’ensemble" subtitle={`Données live · ${RANGE_LABEL[range]}`} hideBack />

      <View style={{ marginBottom: 16 }}>
        <Segmented options={[...RANGES]} value={range} onChange={setRange} />
      </View>

      {stats.isLoading ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            <Skeleton width={STAT_CARD_WIDTH} height={150} radius={16} />
            <Skeleton width={STAT_CARD_WIDTH} height={150} radius={16} />
          </View>
          <Skeleton height={240} radius={16} />
          <Skeleton height={200} radius={16} />
        </View>
      ) : stats.isError || !data ? (
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
      ) : (
        <>
          <Carousel>
            <AdminStatCard
              label="Litiges ouverts"
              value={String(data.openDisputeCount)}
              description="À examiner ou résoudre"
              actionLabel="Voir les litiges"
              icon="scale-outline"
              onPress={() => router.push('/admin/litiges')}
            />
            <AdminStatCard
              label="Paiement bloqué"
              value={formatGnf(data.escrowGmv)}
              description={data.escrowHoldCount === 0 ? 'Aucun séquestre' : `${data.escrowHoldCount} séquestres actifs`}
              actionLabel="Voir les paiements"
              icon="shield-half-outline"
              onPress={() => router.push('/admin/commandes')}
            />
            <AdminStatCard
              label="Validations boutique"
              value={String(data.pendingShopCount)}
              description="Commerce local & enseignes"
              actionLabel="Valider"
              icon="shield-checkmark-outline"
              onPress={() => router.push('/admin/validations')}
            />
            <AdminStatCard
              label="Utilisateurs"
              value={data.totalUsers == null ? '—' : formatNumber(data.totalUsers)}
              description="Comptes inscrits"
              actionLabel="Voir les utilisateurs"
              icon="people-outline"
              onPress={() => router.push('/admin/utilisateurs')}
            />
          </Carousel>

          <Carousel>
            <AdminStatCard
              label="Articles"
              value={formatNumber(data.totalListings)}
              description={`${data.activeListings} actifs · ${data.draftListings ?? 0} brouillons · ${data.soldListings ?? 0} vendus`}
              actionLabel="Voir les articles"
              icon="bag-handle-outline"
              onPress={() => router.push('/admin/articles')}
            />
            <AdminStatCard
              label="Valeur catalogue"
              value={formatGnf(data.catalogValueGnf)}
              description="Somme des annonces actives"
              actionLabel="Voir le catalogue"
              icon="trending-up-outline"
              onPress={() => router.push('/admin/articles')}
            />
            <AdminStatCard
              label="Livraisons actives"
              value={String(data.activeDeliveries)}
              description={data.activeDeliveries > 0 ? 'Missions en cours' : 'Aucune livraison active'}
              actionLabel="Voir livreurs"
              icon="bicycle-outline"
              onPress={() => router.push('/admin/livreurs')}
            />
            <AdminStatCard
              label="Commission"
              value={data.commissionRatePercent == null ? '—' : `${data.commissionRatePercent} %`}
              description={
                data.commissionRatePercent == null ? 'Paramètres plateforme non configurés' : 'Taux plateforme actuel'
              }
              actionLabel="Détail"
              icon="pie-chart-outline"
              onPress={() => router.push('/admin/parametres')}
            />
          </Carousel>

          <SectionCard title="Transactions & Commissions" description={`Aperçu pour la période : ${RANGE_LABEL[range]}`}>
            {transactions.some((t) => t.revenus || t.commissions) ? (
              <AreaChart
                data={transactions}
                series={[
                  { key: 'revenus', label: 'Revenus (GNF)', color: colors.primary },
                  { key: 'commissions', label: 'Commissions (GNF)', color: colors.gold },
                ]}
              />
            ) : (
              <Txt variant="caption" align="center" style={styles.empty}>
                Aucune transaction pour cette période
              </Txt>
            )}
          </SectionCard>

          <SectionCard
            title="Inscriptions"
            description={`${formatNumber(signupTotal)} ${audience} sur la période`}
            right={
              <View style={{ width: 170 }}>
                <Segmented
                  options={[
                    { value: 'acheteurs', label: 'Acheteurs' },
                    { value: 'vendeurs', label: 'Vendeurs' },
                  ]}
                  value={audience}
                  onChange={setAudience}
                />
              </View>
            }>
            <BarChart
              data={inscriptions.map((r) => ({
                label: new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                value: r[audience] || 0,
              }))}
            />
          </SectionCard>

          <View style={styles.duo}>
            <SectionCard title="Livraison vs retrait" description="Volume des commandes du mois par mode">
              <DonutChart
                data={deliveryMix}
                centerValue={formatNumber(deliveryMix[0].value + deliveryMix[1].value)}
                centerLabel="GNF"
              />
            </SectionCard>
            <SectionCard title="Catalogue par catégorie" description="Annonces live regroupées par catégorie">
              {categories.length ? (
                <DonutChart data={categories} centerValue={formatNumber(categoryTotal)} centerLabel="annonces" />
              ) : (
                <Txt variant="caption" align="center" style={styles.empty}>
                  Aucune annonce active
                </Txt>
              )}
            </SectionCard>
          </View>

          <SectionCard title="Activité récente (audit)">
            {data.activity.length === 0 ? (
              <Txt variant="caption" align="center" style={styles.empty}>
                Aucun événement d’audit pour le moment
              </Txt>
            ) : (
              data.activity.slice(0, 8).map((item) => (
                <View key={item.id} style={styles.activity}>
                  <View style={styles.dot} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="body" numberOfLines={2}>
                      {item.message}
                    </Txt>
                    <Txt variant="small">{item.time}</Txt>
                  </View>
                </View>
              ))
            )}
          </SectionCard>

          <SectionCard title="Articles en attente" right={<Badge label={String(data.pendingListingCount)} tone="neutral" />}>
            {data.pendingListings.slice(0, 3).map((a) => {
              const img = listingImages(a)[0];
              return (
                <Pressable key={a.id} style={styles.pendingRow} onPress={() => router.push(`/article/${a.id}` as Href)}>
                  {img ? <Image source={img} style={styles.thumb} contentFit="cover" /> : <View style={styles.thumb} />}
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" numberOfLines={1}>
                      {a.title}
                    </Txt>
                    <Txt variant="small">{LISTING_STATUS_FR[a.status] ?? a.status}</Txt>
                  </View>
                </Pressable>
              );
            })}
            {data.pendingListingCount === 0 ? (
              <Txt variant="caption" align="center" style={styles.empty}>
                Aucun article en attente
              </Txt>
            ) : null}
            <SeeAll href="/admin/articles" />
          </SectionCard>

          <SectionCard title="Litiges à traiter" right={<Badge label={String(data.openDisputeCount)} tone="danger" />}>
            {(data.openDisputes ?? []).slice(0, 3).map((d) => (
              <Pressable key={d.id} style={styles.disputeRow} onPress={() => router.push(`/admin/litige/${d.id}` as Href)}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {d.productTitle}
                  </Txt>
                  <Txt variant="small" numberOfLines={1}>
                    {d.reason}
                  </Txt>
                </View>
                <Badge label={formatGnf(d.amount || 0)} tone="danger" />
              </Pressable>
            ))}
            {data.openDisputeCount === 0 ? (
              <Txt variant="caption" align="center" style={styles.empty}>
                Aucun litige ouvert
              </Txt>
            ) : null}
            <SeeAll href="/admin/litiges" />
          </SectionCard>

          <Button title="Porte-monnaies vendeurs" variant="secondary" onPress={() => router.push('/admin/porte-monnaies')} full />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -16, marginBottom: 14 },
  carousel: { gap: GAP, paddingHorizontal: 16, paddingVertical: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  duo: { gap: 0 },
  empty: { paddingVertical: 24 },
  activity: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.surfaceMuted },
  disputeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  seeAll: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.primary },
});

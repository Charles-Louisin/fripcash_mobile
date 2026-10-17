import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Input, Sheet, Txt } from '@/components/ui';
import type { ShopKindFilter } from '@/lib/api';
import { colors, fonts, radius } from '@/theme';

export type SearchDatePreset = '' | '7' | '30' | '90' | 'custom';

export type SearchFilterState = {
  promo: boolean;
  sellerTypes: ShopKindFilter[];
  destinations: string[];
  categoryIds: string[];
  minListingRating: number;
  minSellerRating: number;
  datePreset: SearchDatePreset;
  dateFrom: string;
  dateTo: string;
};

export const emptySearchFilters: SearchFilterState = {
  promo: false,
  sellerTypes: [],
  destinations: [],
  categoryIds: [],
  minListingRating: 0,
  minSellerRating: 0,
  datePreset: '',
  dateFrom: '',
  dateTo: '',
};

const SELLER_TYPES: { id: ShopKindFilter; label: string }[] = [
  { id: 'particulier', label: 'Particuliers' },
  { id: 'standard', label: 'Boutiques' },
  { id: 'proximite', label: 'Commerces locaux' },
  { id: 'enseigne', label: 'Enseignes' },
];

const DESTINATIONS = [
  { id: 'SECONDE_MAIN', label: 'Seconde main' },
  { id: 'ARTICLES_NEUFS', label: 'Neuf' },
  { id: 'QUARTIER_BOUTIQUES', label: 'Boutiques' },
  { id: 'ENSEIGNES', label: 'Enseignes' },
];

const DATES: { id: SearchDatePreset; label: string }[] = [
  { id: '', label: 'Toutes les dates' },
  { id: '7', label: '7 derniers jours' },
  { id: '30', label: '30 derniers jours' },
  { id: '90', label: '3 derniers mois' },
  { id: 'custom', label: 'Période personnalisée' },
];

export function searchFilterCount(value: SearchFilterState, tab: 'articles' | 'boutiques') {
  return (
    (value.promo ? 1 : 0) +
    value.sellerTypes.length +
    (tab === 'articles' ? value.destinations.length + value.categoryIds.length + (value.minListingRating ? 1 : 0) : 0) +
    (value.minSellerRating ? 1 : 0) +
    (value.datePreset ? 1 : 0)
  );
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function CheckRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
      </View>
      <Txt style={styles.checkLabel}>{label}</Txt>
    </Pressable>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.block}>
      <Txt variant="label">{label}</Txt>
      <View style={styles.wrap}>
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <Pressable key={n} onPress={() => onChange(n)} style={[styles.rate, active && styles.rateOn]}>
              <Txt style={[styles.rateText, active && { color: colors.white }]}>{n === 0 ? 'Tous' : String(n)}</Txt>
              {n > 0 ? <Ionicons name="star" size={11} color={active ? colors.white : '#F59E0B'} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SearchFilterSheet({
  visible,
  onClose,
  value,
  onChange,
  categories,
  tab,
}: {
  visible: boolean;
  onClose: () => void;
  value: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
  categories: { id: string; label: string }[];
  tab: 'articles' | 'boutiques';
}) {
  const set = (patch: Partial<SearchFilterState>) => onChange({ ...value, ...patch });
  const count = searchFilterCount(value, tab);

  return (
    <Sheet visible={visible} onClose={onClose} title="Filtres">
      <View style={styles.body}>
        {count > 0 ? (
          <Pressable onPress={() => onChange(emptySearchFilters)} hitSlop={8}>
            <Txt variant="label" color={colors.primary}>
              Tout effacer
            </Txt>
          </Pressable>
        ) : null}

        <CheckRow label="Promotions" checked={value.promo} onPress={() => set({ promo: !value.promo })} />

        <View style={styles.block}>
          <Txt variant="label">Type de vendeur</Txt>
          {SELLER_TYPES.map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              checked={value.sellerTypes.includes(item.id)}
              onPress={() => set({ sellerTypes: toggle(value.sellerTypes, item.id) as ShopKindFilter[] })}
            />
          ))}
        </View>

        {tab === 'articles' ? (
          <>
            <View style={styles.block}>
              <Txt variant="label">Type d’article</Txt>
              {DESTINATIONS.map((item) => (
                <CheckRow
                  key={item.id}
                  label={item.label}
                  checked={value.destinations.includes(item.id)}
                  onPress={() => set({ destinations: toggle(value.destinations, item.id) })}
                />
              ))}
            </View>

            {categories.length ? (
              <View style={styles.block}>
                <Txt variant="label">Catégories</Txt>
                {categories.map((cat) => (
                  <CheckRow
                    key={cat.id}
                    label={cat.label}
                    checked={value.categoryIds.includes(cat.id)}
                    onPress={() => set({ categoryIds: toggle(value.categoryIds, cat.id) })}
                  />
                ))}
              </View>
            ) : null}

            <RatingRow
              label="Note des articles"
              value={value.minListingRating}
              onChange={(n) => set({ minListingRating: n })}
            />
          </>
        ) : null}

        <RatingRow label="Note des vendeurs" value={value.minSellerRating} onChange={(n) => set({ minSellerRating: n })} />

        <View style={styles.block}>
          <Txt variant="label">Date</Txt>
          {DATES.map((item) => (
            <CheckRow
              key={item.id || 'all'}
              label={item.label}
              checked={value.datePreset === item.id}
              onPress={() =>
                set({
                  datePreset: value.datePreset === item.id ? '' : item.id,
                  dateFrom: item.id === 'custom' ? value.dateFrom : '',
                  dateTo: item.id === 'custom' ? value.dateTo : '',
                })
              }
            />
          ))}
          {value.datePreset === 'custom' ? (
            <View style={{ gap: 8 }}>
              <Input
                label="Du"
                value={value.dateFrom}
                onChangeText={(dateFrom) => set({ datePreset: 'custom', dateFrom })}
                placeholder="AAAA-MM-JJ"
                autoCapitalize="none"
              />
              <Input
                label="Au"
                value={value.dateTo}
                onChangeText={(dateTo) => set({ datePreset: 'custom', dateTo })}
                placeholder="AAAA-MM-JJ"
                autoCapitalize="none"
              />
            </View>
          ) : null}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingBottom: 12 },
  block: { gap: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  rate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  rateOn: { backgroundColor: colors.primary },
  rateText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
});

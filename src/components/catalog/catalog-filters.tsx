import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, Sheet, Txt } from '@/components/ui';
import type { Listing, PublicShop } from '@/lib/api';
import { colors, radius } from '@/theme';

export type CatalogSort = 'recent' | 'price-asc' | 'price-desc' | 'rating' | 'popular';

export type CatalogFilterState = {
  categoryId?: string;
  categoryName?: string;
  zoneId?: string;
  condition?: string;
  sort?: CatalogSort;
};

const SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
];

export const SHOP_SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'rating', label: 'Mieux notées' },
  { value: 'popular', label: 'Populaires' },
];

export function hasActiveFilters(value: CatalogFilterState) {
  return !!(value.categoryId || value.categoryName || value.zoneId || value.condition || (value.sort && value.sort !== 'recent'));
}

export function sortListings(list: Listing[], sort: CatalogSort = 'recent') {
  const copy = [...list];
  if (sort === 'price-asc') copy.sort((a, b) => a.priceGnf - b.priceGnf);
  else if (sort === 'price-desc') copy.sort((a, b) => b.priceGnf - a.priceGnf);
  else if (sort === 'rating') copy.sort((a, b) => (b.listingRating ?? 0) - (a.listingRating ?? 0));
  else {
    copy.sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    );
  }
  return copy;
}

export function sortShops(list: PublicShop[], sort: CatalogSort = 'recent') {
  const copy = [...list];
  if (sort === 'rating') copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  else if (sort === 'popular') {
    copy.sort(
      (a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0) || (b.listingsCount ?? 0) - (a.listingsCount ?? 0),
    );
  } else {
    copy.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }
  return copy;
}

export function FilterButton({
  onPress,
  active,
  label,
}: {
  onPress: () => void;
  active?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Filtres"
      hitSlop={6}
      style={({ pressed }) => [styles.filterBtn, active && styles.filterBtnActive, { opacity: pressed ? 0.75 : 1 }]}>
      {label ? (
        <Txt variant="label" color={active ? colors.white : colors.text}>
          {label}
        </Txt>
      ) : null}
      <Ionicons name="options-outline" size={18} color={active ? colors.white : colors.text} />
    </Pressable>
  );
}

export function FilterSheet({
  visible,
  onClose,
  title = 'Filtres',
  categories,
  zones,
  conditions,
  sorts = SORTS,
  value,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  categories?: { id: string; label: string }[];
  zones?: { id: string; label: string }[];
  conditions?: string[];
  sorts?: { value: CatalogSort; label: string }[];
  value: CatalogFilterState;
  onApply: (next: CatalogFilterState) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {visible ? (
        <FilterForm
          key={`${value.categoryId ?? ''}-${value.categoryName ?? ''}-${value.zoneId ?? ''}-${value.condition ?? ''}-${value.sort ?? 'recent'}`}
          categories={categories}
          zones={zones}
          conditions={conditions}
          sorts={sorts}
          value={value}
          onApply={onApply}
          onClose={onClose}
        />
      ) : null}
    </Sheet>
  );
}

function FilterForm({
  categories,
  zones,
  conditions,
  sorts,
  value,
  onApply,
  onClose,
}: {
  categories?: { id: string; label: string }[];
  zones?: { id: string; label: string }[];
  conditions?: string[];
  sorts: { value: CatalogSort; label: string }[];
  value: CatalogFilterState;
  onApply: (next: CatalogFilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const set = (patch: Partial<CatalogFilterState>) => setDraft((d) => ({ ...d, ...patch }));

  return (
      <View style={styles.sheetBody}>
        {categories?.length ? (
          <View style={styles.block}>
            <Txt variant="label">Catégorie</Txt>
            <View style={styles.wrap}>
              <Chip
                label="Toutes"
                active={!draft.categoryId && !draft.categoryName}
                onPress={() => set({ categoryId: undefined, categoryName: undefined })}
              />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  active={draft.categoryId === c.id || draft.categoryName === c.label}
                  onPress={() =>
                    set({
                      categoryId: c.id,
                      categoryName: c.label,
                    })
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {zones?.length ? (
          <View style={styles.block}>
            <Txt variant="label">Quartier</Txt>
            <View style={styles.wrap}>
              <Chip label="Tous" active={!draft.zoneId} onPress={() => set({ zoneId: undefined })} />
              {zones.map((z) => (
                <Chip
                  key={z.id}
                  label={z.label}
                  active={draft.zoneId === z.id}
                  onPress={() => set({ zoneId: z.id })}
                />
              ))}
            </View>
          </View>
        ) : null}

        {conditions?.length ? (
          <View style={styles.block}>
            <Txt variant="label">État</Txt>
            <View style={styles.wrap}>
              <Chip label="Tous" active={!draft.condition} onPress={() => set({ condition: undefined })} />
              {conditions.map((c) => (
                <Chip key={c} label={c} active={draft.condition === c} onPress={() => set({ condition: c })} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.block}>
          <Txt variant="label">Trier</Txt>
          <View style={styles.wrap}>
            {sorts.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                active={(draft.sort ?? 'recent') === s.value}
                onPress={() => set({ sort: s.value })}
              />
            ))}
          </View>
        </View>

        <Button
          title="Appliquer"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
          full
        />
        <Button
          title="Réinitialiser"
          variant="ghost"
          onPress={() => {
            const empty: CatalogFilterState = { sort: 'recent' };
            setDraft(empty);
            onApply(empty);
            onClose();
          }}
          full
        />
      </View>
  );
}

const styles = StyleSheet.create({
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sheetBody: { gap: 18, paddingBottom: 8 },
  block: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

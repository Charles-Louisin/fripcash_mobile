import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type GuestCartItem = {
  listingId: string;
  title: string;
  priceGnf: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
  zoneId: string | null;
};

type GuestCartState = {
  items: GuestCartItem[];
  add: (item: GuestCartItem) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  remove: (listingId: string) => void;
  clear: () => void;
};

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.listingId === item.listingId);
          if (existing) return s;
          return { items: [...s.items, item] };
        }),
      setQuantity: (listingId, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.listingId === listingId ? { ...i, quantity: Math.max(1, quantity) } : i)),
        })),
      remove: (listingId) => set((s) => ({ items: s.items.filter((i) => i.listingId !== listingId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'fripcash.guest-cart', storage: createJSONStorage(() => AsyncStorage) }
  )
);

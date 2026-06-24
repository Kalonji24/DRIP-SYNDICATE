'use client';

import { create } from 'zustand';
import { api, apiError } from '@/lib/api';
import type { Cart } from '@/types';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  count: number;
  fetch: () => Promise<void>;
  add: (productVariantId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  reset: () => void;
}

function deriveCount(cart: Cart | null): number {
  return cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  error: null,
  count: 0,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<Cart>('/cart');
      set({ cart: data, count: deriveCount(data), loading: false });
    } catch (err) {
      set({ error: apiError(err), loading: false });
    }
  },

  add: async (productVariantId, quantity = 1) => {
    set({ error: null });
    try {
      const { data } = await api.post<Cart>('/cart/items', {
        productVariantId,
        quantity
      });
      set({ cart: data, count: deriveCount(data) });
    } catch (err) {
      set({ error: apiError(err) });
      throw err;
    }
  },

  update: async (itemId, quantity) => {
    const { data } = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
    set({ cart: data, count: deriveCount(data) });
  },

  remove: async (itemId) => {
    const { data } = await api.delete<Cart>(`/cart/items/${itemId}`);
    set({ cart: data, count: deriveCount(data) });
  },

  reset: () => set({ cart: null, count: 0, error: null })
}));

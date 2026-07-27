import { create } from 'zustand';
import { makeRef } from '@/lib/idempotency';
import type { CartLine, MenuItem } from '@/types/domain';

type CartState = {
  tableRef: string | null;
  pax: number | null;
  lines: CartLine[];
  /**
   * Idempotency key for this cart's submission. Minted on the first Submit tap and
   * held here — NOT inside the mutation — so every retry of that same tap reuses it
   * and the server dedupes. Cleared with the cart on success.
   */
  offlineRef: string | null;
  ensureOfflineRef: () => string;
  /** Seed the cart (e.g. reopening an existing draft order). */
  seed: (tableRef: string, pax: number, lines: CartLine[]) => void;
  /**
   * Correct the cover count without touching the cart.
   *
   * Separate from `seed` because seeding clears `offlineRef`, and covers arrive a beat
   * after the screen does (the table list resolves async) — re-seeding to set them
   * would throw away the idempotency key of an order already being submitted.
   */
  setPax: (pax: number) => void;
  addItem: (item: MenuItem) => void;
  changeQty: (itemId: string, delta: number) => void;
  setNote: (itemId: string, note: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  tableRef: null,
  pax: null,
  lines: [],
  offlineRef: null,

  ensureOfflineRef: () => {
    const existing = get().offlineRef;
    if (existing) return existing;
    const ref = makeRef('so');
    set({ offlineRef: ref });
    return ref;
  },

  seed: (tableRef, pax, lines) => set({ tableRef, pax, lines, offlineRef: null }),

  setPax: (pax) => set({ pax }),

  addItem: (item) =>
    set((state) => {
      const existing = state.lines.find((l) => l.itemId === item.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l,
          ),
        };
      }
      const line: CartLine = {
        itemId: item.id,
        name: item.name,
        qty: 1,
        price: item.price,
        station: item.station,
      };
      return { lines: [...state.lines, line] };
    }),

  changeQty: (itemId, delta) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    })),

  setNote: (itemId, note) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.itemId === itemId ? { ...l, note: note || undefined } : l,
      ),
    })),

  clear: () => set({ lines: [], offlineRef: null }),
}));

/** Derived selectors — keep math out of components. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}

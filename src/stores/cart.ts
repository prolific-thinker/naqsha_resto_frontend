import { create } from 'zustand';
import type { CartLine, MenuItem } from '@/types/domain';

type CartState = {
  tableRef: string | null;
  pax: number | null;
  lines: CartLine[];
  /** Seed the cart (e.g. reopening an existing draft order). */
  seed: (tableRef: string, pax: number, lines: CartLine[]) => void;
  addItem: (item: MenuItem) => void;
  changeQty: (itemId: string, delta: number) => void;
  setNote: (itemId: string, note: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  tableRef: null,
  pax: null,
  lines: [],

  seed: (tableRef, pax, lines) => set({ tableRef, pax, lines }),

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

  clear: () => set({ lines: [] }),
}));

/** Derived selectors — keep math out of components. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}

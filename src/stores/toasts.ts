import { create } from 'zustand';

/**
 * Toasts.
 *
 * Built in-house rather than pulling in a library: the app has no toast dependency, the
 * design system is hand-rolled (Chip, DataRow, FormDialog), and what this needs that an
 * off-the-shelf toaster does not give for free is the `sticky` behaviour below.
 *
 * These carry *service* messages — "table 4 is ready to collect" — not form feedback. A
 * failed mutation still reports inline where the user is looking, exactly as before; see
 * FormDialog's note on why a server error is never a toast.
 */

export type ToastKind = 'collect' | 'escalate' | 'info';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** Wall-clock ms this arrived, so the host can render "2m ago" on a sticky one. */
  at: number;
  /**
   * A sticky toast waits for a tap instead of expiring.
   *
   * A waiter carrying three plates is not looking at their tablet when the collect
   * notification fires, and a message that auto-dismissed four seconds later did not
   * inform anybody — it just made the system feel responsive to whoever was watching.
   * Anything that asks a human to go and do something physical stays until acknowledged.
   */
  sticky: boolean;
  /** Dedupe key. A second toast with a live key replaces rather than stacks. */
  dedupeKey?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'at'> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

/** Cap the stack. Past this a screen is wallpaper and nothing on it gets read. */
const MAX_VISIBLE = 4;

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (t) => {
    const id = t.id ?? `t${++seq}`;
    set((state) => {
      // Replace-by-key rather than stack. The manager escalating the same ticket twice,
      // or two dispatches landing together, should not build a tower of near-identical
      // cards the waiter has to clear one at a time.
      const kept = t.dedupeKey
        ? state.toasts.filter((x) => x.dedupeKey !== t.dedupeKey)
        : state.toasts;
      const next = [...kept, { ...t, id, at: Date.now() }];
      return { toasts: next.slice(-MAX_VISIBLE) };
    });
    return id;
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

/** Imperative entry point for non-React callers (the realtime bridge). */
export function pushToast(t: Omit<Toast, 'id' | 'at'>): string {
  return useToastStore.getState().push(t);
}

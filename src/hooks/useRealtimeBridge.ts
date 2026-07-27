import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { subscribe } from '@/lib/realtime/socket';

/**
 * Turns server events into query invalidations, once, for the whole app.
 *
 * Screens still subscribe to their own channels for their own board; this bridge is
 * what keeps *other* screens fresh — the manager floor reacting to a kitchen action,
 * the bill reacting to a payment in another tab.
 *
 * Invalidation is debounced per key, and that is not an optimisation. The SLA sweeper
 * runs every 60s and can flip a whole batch of tickets in one pass, each publishing
 * its own kot_update. Without the trailing debounce a busy service refetches the KDS
 * board roughly ten times a second.
 */
const DEBOUNCE_MS = 250;

export function useRealtimeBridge(): void {
  const qc = useQueryClient();

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const invalidate = (key: QueryKey) => {
      const id = JSON.stringify(key);
      clearTimeout(timers.get(id));
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          void qc.invalidateQueries({ queryKey: key });
        }, DEBOUNCE_MS),
      );
    };

    const unsubs = [
      subscribe('kot', (payload) => {
        const station = (payload as { station?: string })?.station;
        if (station) invalidate(['kds', station]);
        invalidate(['aggregate']);
        // Prefix match: ['tables'] hits both ['tables','waiter'] and ['tables','manager'].
        invalidate(['tables']);
      }),
      subscribe('tables', () => {
        invalidate(['tables']);
        invalidate(['aggregate']);
      }),
      subscribe('menu', () => {
        invalidate(['menu', 'items']);
        invalidate(['menu', 'categories']);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
      timers.forEach((t) => clearTimeout(t));
    };
  }, [qc]);
}

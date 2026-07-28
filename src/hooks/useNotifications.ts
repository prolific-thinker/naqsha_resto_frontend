import { useEffect } from 'react';
import { subscribe, subscribeStationRoom } from '@/lib/realtime/socket';
import { pushToast, type ToastKind } from '@/stores/toasts';

interface NotifyPayload {
  kind?: string;
  title?: string;
  body?: string | null;
  audience?: { scope?: string; user?: string; station?: string };
  data?: Record<string, unknown>;
}

const KNOWN_KINDS: ToastKind[] = ['collect', 'escalate'];

function toKind(raw: string | undefined): ToastKind {
  return KNOWN_KINDS.includes(raw as ToastKind) ? (raw as ToastKind) : 'info';
}

/**
 * Turns `naqsha:notify` into toasts.
 *
 * Mounted once app-wide, next to `useRealtimeBridge`. The two are deliberately separate:
 * the bridge keeps *data* fresh and must stay silent, this one interrupts a human. Merging
 * them is how "the board refreshed" turns into a notification nobody asked for.
 *
 * There is no audience filtering here, and that is the point — the server addresses each
 * notification to one user room or one station room, so anything that arrives was meant
 * for this screen. Filtering client-side would mean the payload had already been
 * broadcast to everyone, which is the thing the design avoids.
 */
export function useNotifications(): void {
  useEffect(() => {
    return subscribe('notify', (raw) => {
      const p = (raw ?? {}) as NotifyPayload;
      if (!p.title) return;

      const kind = toKind(p.kind);
      const data = p.data ?? {};

      // Dedupe on the thing the message is about, not on its text. Two escalations of
      // the same ticket are one message; two different tables are two.
      const dedupeKey =
        kind === 'escalate'
          ? `escalate:${String(data.kot ?? '')}`
          : kind === 'collect'
            ? `collect:${String(data.table ?? '')}`
            : undefined;

      pushToast({
        kind,
        title: p.title,
        body: p.body ?? undefined,
        // Both real kinds ask a human to walk somewhere, so both wait for a tap. An
        // auto-dismissing "table 4 is ready" is indistinguishable from never having
        // sent it, for exactly the person it was sent to.
        sticky: kind === 'collect' || kind === 'escalate',
        dedupeKey,
      });
    });
  }, []);
}

/**
 * Join one station's room for as long as a KDS board is on screen.
 *
 * Called by the station board with its own station id, so the drinks screen hears drinks
 * escalations and nothing else. Unsubscribes on unmount, so a cook who navigates to
 * another station stops receiving the old one's.
 */
export function useStationNotifications(stationId: string | undefined): void {
  useEffect(() => {
    if (!stationId) return;
    return subscribeStationRoom(stationId);
  }, [stationId]);
}

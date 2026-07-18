import type { KotState, Station } from '@/types/domain';

/**
 * Realtime stub. Exposes the same subscribe() surface the real socket will, and
 * publishes fake KOT state transitions on an interval so KDS timers and the
 * manager aggregate feel alive. When the real socket lands, only this file
 * changes (handover §7).
 */

export type KotTick = {
  type: 'kot.tick';
  station: Station;
  ref: string;
  state: KotState;
  at: number;
};

type Handler = (payload: unknown) => void;

const PUBLISH_INTERVAL_MS = 8_000;
const STATIONS: Station[] = ['drinks', 'main', 'bbq'];
const STATES: KotState[] = ['queued', 'preparing', 'breach', 'prepared'];

const channels = new Map<string, Set<Handler>>();
let timer: ReturnType<typeof setInterval> | null = null;
let seq = 1042;

function pick<T>(arr: T[]): T {
  // arr is always non-empty here; the fallback keeps noUncheckedIndexedAccess happy.
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] ?? arr[0]!;
}

function tick() {
  const station = pick(STATIONS);
  const event: KotTick = {
    type: 'kot.tick',
    station,
    ref: `KOT-${station[0]?.toUpperCase()}-${seq++}`,
    state: pick(STATES),
    at: Date.now(),
  };
  // Fan out to the station channel and the wildcard channel.
  for (const channel of [`kds:${station}`, 'kds:*', 'kot']) {
    channels.get(channel)?.forEach((handler) => handler(event));
  }
}

function ensureTimer() {
  if (timer === null && channels.size > 0) {
    timer = setInterval(tick, PUBLISH_INTERVAL_MS);
  }
}

function maybeStopTimer() {
  if (timer !== null && channels.size === 0) {
    clearInterval(timer);
    timer = null;
  }
}

/** Subscribe to a channel; returns an unsubscribe function. */
export function subscribe(channel: string, handler: Handler): () => void {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(handler);
  ensureTimer();

  return () => {
    const current = channels.get(channel);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) channels.delete(channel);
    maybeStopTimer();
  };
}

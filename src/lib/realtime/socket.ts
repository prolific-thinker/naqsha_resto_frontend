import { io, type Socket } from 'socket.io-client';
import { EVENTS } from '@/lib/api/endpoints';
import { SITE_NAME } from '@/lib/api/http';

/**
 * Frappe realtime.
 *
 * `subscribe(channel, handler)` is preserved verbatim from the stub this replaces, so
 * useKotStream and useAggregate did not change. The server publishes four `naqsha:*`
 * events; this module fans each out to the logical channels the hooks already use.
 *
 * Three things must line up, and each fails silently if it does not:
 *
 *  1. The namespace IS the site name. frappe/realtime/index.js mounts io.of(/^\/.*$/)
 *     and its auth middleware asserts namespace === site name. Sourced from
 *     VITE_SITE_NAME — never from window.location.hostname, because nginx may serve
 *     the SPA on a hostname that is not the Frappe site name.
 *  2. Same origin. The middleware rejects a connection whose Host hostname differs
 *     from its Origin hostname, quite apart from the cookie needing to be same-origin.
 *  3. Publishes with no explicit room land in the site room "all", which a socket
 *     joins only when user_type == "System User". All Naqsha staff users are System
 *     Users; a Website User would receive nothing.
 */

type Handler = (payload: unknown) => void;

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

const channels = new Map<string, Set<Handler>>();
let socket: Socket | null = null;
let status: RealtimeStatus = 'idle';
const statusWatchers = new Set<(s: RealtimeStatus) => void>();

function setStatus(next: RealtimeStatus): void {
  if (status === next) return;
  status = next;
  statusWatchers.forEach((w) => w(next));
}

export function getRealtimeStatus(): RealtimeStatus {
  return status;
}

export function watchRealtimeStatus(fn: (s: RealtimeStatus) => void): () => void {
  statusWatchers.add(fn);
  fn(status);
  return () => {
    statusWatchers.delete(fn);
  };
}

function emit(channel: string, payload: unknown): void {
  channels.get(channel)?.forEach((handler) => handler(payload));
}

/** Map one server event onto every logical channel that cares about it. */
function fanOut(event: string, payload: Record<string, unknown>): void {
  switch (event) {
    case EVENTS.kotUpdate: {
      const st = String(payload.station ?? '');
      const table = String(payload.table ?? '');
      emit('kot', payload);
      if (st) emit(`kds:${st}`, payload);
      emit('kds:*', payload);
      emit('aggregate', payload);
      emit('tables', payload);
      if (table) emit(`table:${table}`, payload);
      break;
    }
    case EVENTS.tableUpdate: {
      const table = String(payload.table ?? '');
      emit('tables', payload);
      emit('aggregate', payload);
      if (table) emit(`table:${table}`, payload);
      break;
    }
    case EVENTS.invoiceUpdate: {
      const table = String(payload.table ?? '');
      emit('tables', payload);
      if (table) {
        emit(`invoice:${table}`, payload);
        emit(`table:${table}`, payload);
      }
      break;
    }
    case EVENTS.menuUpdate:
      emit('menu', payload);
      break;
    default:
      break;
  }
}

function ensureConnected(): void {
  if (socket) return;

  if (!SITE_NAME) {
    // Better a loud console line than a board that silently never updates.
    console.warn('[naqsha] VITE_SITE_NAME is unset; realtime is disabled.');
    return;
  }

  setStatus('connecting');
  socket = io(`${window.location.origin}/${SITE_NAME}`, {
    path: '/socket.io/',
    withCredentials: true,
    autoConnect: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 10_000,
  });

  socket.on('connect', () => setStatus('connected'));
  socket.on('disconnect', () => setStatus('disconnected'));
  socket.on('connect_error', () => setStatus('disconnected'));

  for (const event of Object.values(EVENTS)) {
    socket.on(event, (payload: Record<string, unknown>) => fanOut(event, payload ?? {}));
  }
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  setStatus('idle');
}

/** Subscribe to a logical channel; returns an unsubscribe function. */
export function subscribe(channel: string, handler: Handler): () => void {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(handler);
  ensureConnected();

  return () => {
    const current = channels.get(channel);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) channels.delete(channel);
    // Deliberately keep the socket open when the last subscriber leaves: screens
    // unmount and remount constantly during navigation, and reconnect churn costs
    // more than one idle socket. disconnectSocket() is called explicitly on logout.
  };
}

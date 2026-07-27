import { format as formatDate, isToday, isYesterday, parseISO } from 'date-fns';
import type { Station } from '@/types/domain';

/**
 * Shared adapter helpers.
 *
 * Adapters map the server's wire contract (src/types/server.ts) onto the app's
 * view-model Zod schemas (src/types/api.ts). They are pure and synchronous: context
 * the payload lacks arrives as an explicit argument, never as a fetch.
 */

/**
 * The single most important helper in this folder.
 *
 * Frappe serialises every empty field as JSON `null`. Zod's `.optional()` accepts
 * `undefined` but REJECTS `null`. Route every optional mapping through this, or the
 * screen throws a ZodError on data that looked perfectly fine in curl.
 */
export function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

/** Like `opt`, but also drops 0 — for values where 0 means "nothing to show". */
export function optNum(value: number | null | undefined): number | undefined {
  return value ? value : undefined;
}

const KNOWN_STATIONS = new Set<Station>(['drinks', 'main', 'bbq']);

/**
 * The backend models `station_key` as free-form Data on purpose, so the cafe can add
 * a station without a migration (PLAN_FRAPPE_BACKEND.md §2.3). `StationSchema` has
 * been relaxed to z.string() to match, but the three known keys still drive layout in
 * a few places, so this narrows where it can and passes through where it cannot.
 */
export function station(key: string | null | undefined): Station {
  const k = (key ?? '').toLowerCase();
  return (KNOWN_STATIONS.has(k as Station) ? k : k || 'main') as Station;
}

/** ISO datetime -> "19:22". Returns undefined for null, per `opt`. */
export function hhmm(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  try {
    return formatDate(parseISO(iso), 'HH:mm');
  } catch {
    return undefined;
  }
}

/** Whole seconds elapsed since an ISO timestamp. Never negative. */
export function sinceSeconds(iso: string | null | undefined, now: number = Date.now()): number | undefined {
  if (!iso) return undefined;
  try {
    return Math.max(0, Math.floor((now - parseISO(iso).getTime()) / 1000));
  } catch {
    return undefined;
  }
}

/** Whole seconds between two ISO timestamps. */
export function secondsBetween(from: string | null | undefined, to: string | null | undefined): number | undefined {
  if (!from || !to) return undefined;
  try {
    return Math.max(0, Math.floor((parseISO(to).getTime() - parseISO(from).getTime()) / 1000));
  } catch {
    return undefined;
  }
}

/** Coarse human duration for session length: "1h 26m", "46m". */
export function humanDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * The KDS meta sends a pre-formatted "4m 22s" (kds.py::_duration_label) but the UI
 * wants "04:22". Reparse rather than guess.
 */
export function parseDurationLabel(label: string | null | undefined): number {
  if (!label) return 0;
  const m = /(?:(\d+)\s*m)?\s*(\d+)\s*s/.exec(label);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

/** "Today · 19:22" / "Yesterday · 19:22" / "Thu 16 Jul · 19:22". */
export function whenLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    const time = formatDate(d, 'HH:mm');
    if (isToday(d)) return `Today · ${time}`;
    if (isYesterday(d)) return `Yesterday · ${time}`;
    return `${formatDate(d, 'EEE d MMM')} · ${time}`;
  } catch {
    return '—';
  }
}

/** Naive pluraliser for the label strings the cards render. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

// ---------------------------------------------------------------------------
// Date-only helpers
// ---------------------------------------------------------------------------
// The ERP methods return "2026-07-20" (a Frappe Date, no time, no offset), not the
// ISO-with-offset the operations methods send. `parseISO` on a bare date is fine, but
// `new Date("2026-07-20")` is NOT — it parses as UTC midnight and renders as the day
// before anywhere west of Greenwich. Everything below goes through parseISO.

function safeDay(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const d = parseISO(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** "2026-07-20" -> "20 Jul". */
export function dayShort(value: string | null | undefined): string {
  const d = safeDay(value);
  return d ? formatDate(d, 'd MMM') : '—';
}

/** "2026-07-20" -> "Mon 20". Used for the report chart's x-axis. */
export function dayTick(value: string | null | undefined): string {
  const d = safeDay(value);
  return d ? formatDate(d, 'EEE d') : '—';
}

/** Two dates -> "20 Jul – 26 Jul", collapsing to one label when they match. */
export function rangeLabel(from: string | null | undefined, to: string | null | undefined): string {
  const a = dayShort(from);
  const b = dayShort(to);
  return a === b ? a : `${a} – ${b}`;
}

/** "2026-07-20" -> "since Jul 2026". */
export function sinceLabel(value: string | null | undefined): string {
  const d = safeDay(value);
  return d ? `since ${formatDate(d, 'MMM yyyy')}` : 'no first visit recorded';
}

/** Wastage reason -> display label. Shared by the manager form and the owner queue. */
export const REASON_LABEL: Record<string, string> = {
  spillage: 'Spillage',
  refused: 'Customer refused',
  cook_error: 'Cook error',
  expired: 'Expired',
  other: 'Other',
};

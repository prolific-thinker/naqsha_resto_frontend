import { duration } from '@/lib/format';
import { KNOWN_STATIONS } from '@/types/domain';
import type { AggregateRow, KdsBoard, Kot, StationLine, StationMeta } from '@/types/domain';
import type { SrvAggregateRow, SrvKdsBoard, SrvKot, SrvStationMeta } from '@/types/server';
import { opt, parseDurationLabel, plural, secondsBetween, sinceSeconds, station } from './shared';

/** `kds.board` / `kds.aggregate` → `KdsBoardSchema` / `AggregateRowSchema`. */

export function toStationMeta(raw: SrvStationMeta): StationMeta {
  return {
    station: station(raw.stationKey),
    name: raw.stationName,
    stationId: raw.stationId,
    slaSeconds: raw.slaSeconds,
    activeMax: raw.activeMax,
    // The server pre-formats "4m 22s"; every other duration in the UI is "MM:SS".
    avgPrepLabel: duration(parseDurationLabel(raw.avgPrepLabel)),
    slaCompliancePct: raw.slaCompliancePct,
    totalPrepared: raw.totalPrepared,
  };
}

export function toKot(raw: SrvKot, now: number = Date.now()): Kot {
  const running = raw.state === 'preparing' || raw.state === 'breach';

  return {
    ref: raw.ref,
    station: station(raw.station),
    tableRef: raw.tableRef ?? raw.tableNumber ?? '—',
    items: (raw.items ?? []).map((i) => ({
      // Server key is `itemName`; the view model's key is `name`.
      name: i.itemName ?? i.item,
      qty: i.qty,
      comment: opt(i.comment),
    })),
    state: raw.state,
    // KotTimer counts up from this. Omit it and the timers stop.
    receivedAt: opt(raw.receivedAt),
    waitSeconds: raw.state === 'queued' ? sinceSeconds(raw.queuedAt ?? raw.receivedAt, now) : undefined,
    elapsedSeconds: running ? sinceSeconds(raw.startedAt ?? raw.receivedAt, now) : undefined,
    slaSeconds: raw.slaSeconds,
    // Anchored on queuedAt, NOT startedAt, to match the server's own average
    // (`timestampdiff(second, queued_at, prepared_at)` in kds.py::_station_meta).
    // Anchor it differently and the per-card number disagrees with the footer
    // average on the same wall display.
    doneSeconds: raw.state === 'prepared' ? secondsBetween(raw.queuedAt, raw.preparedAt) : undefined,
    onTime: opt(raw.onTime),
  };
}

export function toKdsBoard(raw: SrvKdsBoard, now: number = Date.now()): KdsBoard {
  return {
    meta: toStationMeta(raw.meta),
    queue: (raw.queue ?? []).map((k) => toKot(k, now)),
    active: (raw.active ?? []).map((k) => toKot(k, now)),
    prepared: (raw.prepared ?? []).map((k) => toKot(k, now)),
  };
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** Server severity order: breach is worst, prepared is best. */
const SEVERITY: Record<string, number> = { breach: 0, queued: 1, preparing: 2, prepared: 3 };

const STATUS_OF: Record<string, StationLine['status']> = {
  queued: 'queued',
  preparing: 'prep',
  breach: 'prep',
  prepared: 'ready',
};

/**
 * `kds.aggregate` sends one entry per KOT, so a station can repeat or be missing.
 * The row grid is a fixed three columns, so collapse to exactly the known stations
 * in a fixed order — anything else breaks the layout.
 *
 * `boards` is the per-station KDS board cache, used to render the real item names
 * and per-station timings the aggregate payload does not carry. It is optional:
 * without it the line degrades to a ticket count, which is honest rather than wrong.
 */
export function toAggregateRow(
  raw: SrvAggregateRow,
  boards?: Map<string, Kot[]>,
  now: number = Date.now(),
): AggregateRow {
  const rowState: AggregateRow['rowState'] =
    raw.worstState === 'breach'
      ? 'breach'
      : raw.totalCount > 0 && raw.readyCount === raw.totalCount
        ? 'ready'
        : 'normal';

  const stations: StationLine[] = KNOWN_STATIONS.map((key) => {
    const entries = (raw.stations ?? []).filter((s) => station(s.station) === key);
    if (!entries.length) {
      return { station: key, items: '— none —', status: 'none', statusLabel: 'no items' };
    }

    const worst = entries.reduce((a, b) => ((SEVERITY[a.state] ?? 9) <= (SEVERITY[b.state] ?? 9) ? a : b));
    const status = STATUS_OF[worst.state] ?? 'queued';
    const overSla = entries.some((e) => e.state === 'breach');

    const kots = boards?.get(key) ?? [];
    const items = kots.length
      ? kots
          .flatMap((k) => k.items)
          .map((i) => `${i.qty}× ${i.name}`)
          .join(' · ')
      : `${entries.length} ${plural(entries.length, 'ticket')}`;

    const elapsed =
      kots.length && kots[0]
        ? (sinceSeconds(kots[0].receivedAt, now) ?? 0)
        : (sinceSeconds(raw.oldestReceivedAt, now) ?? 0);
    const sla = kots[0]?.slaSeconds ?? 0;

    let statusLabel: string;
    if (status === 'ready') statusLabel = `ready · ${duration(elapsed)}`;
    else if (status === 'prep' && overSla && sla)
      statusLabel = `${duration(elapsed)} · +${duration(Math.max(0, elapsed - sla))} over SLA`;
    else if (status === 'prep') statusLabel = `${duration(elapsed)} preparing`;
    else statusLabel = `queued · ${duration(elapsed)} wait`;

    return { station: key, items, status, statusLabel, overSla: overSla || undefined };
  });

  const waiting = stations.filter((s) => s.status === 'queued' || s.status === 'prep');
  const overStation = stations.find((s) => s.overSla)?.station ?? 'kitchen';
  const oldest = sinceSeconds(raw.oldestReceivedAt, now) ?? 0;

  const action: AggregateRow['action'] =
    rowState === 'ready'
      ? {
          kind: 'dispatch',
          label: 'Dispatch waiter →',
          hint: `${raw.totalCount} ${plural(raw.totalCount, 'ticket')} · ${raw.waiter ?? 'unassigned'}`,
        }
      : rowState === 'breach'
        ? {
            kind: 'escalate',
            label: `Escalate → ${overStation}`,
            hint: `${raw.waiter ?? 'Unassigned'} · waiting ${duration(oldest)}`,
            // Carried so the button can open that station's board. "Escalate" with
            // nowhere to go is a label, not an action.
            station: stations.find((s) => s.overSla)?.station,
          }
        : {
            kind: 'waiting',
            label:
              waiting.length >= KNOWN_STATIONS.length
                ? `Waiting on all ${KNOWN_STATIONS.length}`
                : `Wait on ${waiting.map((s) => s.station).join(' + ') || 'kitchen'}`,
            hint: `${raw.readyCount}/${raw.totalCount} ready`,
          };

  return {
    tableRef: raw.tableRef,
    tableNumber: raw.tableNumber ?? raw.tableRef,
    rowState,
    stations,
    action,
  };
}

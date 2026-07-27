import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Timer } from 'lucide-react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Chip } from '@/components/naqsha/Chip';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { KNOWN_STATIONS, type AggregateRow, type Station, type StationLine } from '@/types/domain';
import { useAggregate } from '@/hooks/useAggregate';
import { useDispatchTable } from '@/hooks/useActions';
import { useSessionStore } from '@/stores/session';

const STATION_BORDER: Record<Station, string> = {
  drinks: 'border-l-station-drinks',
  main: 'border-l-amber',
  bbq: 'border-l-alert',
};

const STATUS_TONE: Record<StationLine['status'], string> = {
  queued: 'text-muted',
  prep: 'text-amber',
  ready: 'text-success',
  none: 'text-muted',
};

const STATION_DOT: Record<string, string> = {
  drinks: 'bg-station-drinks',
  main: 'bg-amber',
  bbq: 'bg-alert',
};

/** A station line is live when it actually has tickets on it. */
function isLive(line: StationLine): boolean {
  return line.status !== 'none';
}

type StationTally = { station: Station; total: number; ready: number; breached: number };

/**
 * Per-station ticket tallies across the open tables.
 *
 * These used to be literals — "Drinks · 4", "Main · 5", "BBQ · 3" — on buttons that
 * had no click handler. A count that does not move while the floor does is worse than
 * no count: it reads as a live number and is not one.
 */
function tallyStations(rows: AggregateRow[]): StationTally[] {
  const byStation = new Map<Station, StationTally>();
  for (const row of rows) {
    for (const line of row.stations) {
      if (!isLive(line)) continue;
      const tally = byStation.get(line.station) ?? {
        station: line.station,
        total: 0,
        ready: 0,
        breached: 0,
      };
      tally.total += 1;
      if (line.status === 'ready') tally.ready += 1;
      if (line.overSla) tally.breached += 1;
      byStation.set(line.station, tally);
    }
  }
  // KNOWN_STATIONS first and in order, then any extra station the site has added —
  // `Station` is deliberately a free-form string, so a fourth one must still show up.
  const knownKeys = new Set<string>(KNOWN_STATIONS);
  const known = KNOWN_STATIONS.filter((s) => byStation.has(s)).map((s) => byStation.get(s)!);
  const extra = [...byStation.values()].filter((t) => !knownKeys.has(t.station));
  return [...known, ...extra];
}

function StationCol({ line }: { line: StationLine }) {
  return (
    <div className={cn('border-l-2 pl-4', STATION_BORDER[line.station] ?? 'border-l-line-2')}>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
        {line.station}
      </div>
      <div className="mt-1 text-[12.5px] leading-[1.4] text-ink">{line.items}</div>
      <div className={cn('mt-1 flex items-center gap-1 font-mono text-[10.5px]', STATUS_TONE[line.status])}>
        {line.status === 'ready' && <Check size={12} />}
        {line.status === 'prep' && <Timer size={12} />}
        <span className={line.overSla ? 'text-alert' : undefined}>{line.statusLabel}</span>
      </div>
    </div>
  );
}

function ActionCell({
  row,
  onDispatch,
  onEscalate,
  busy,
  canDispatch,
}: {
  row: AggregateRow;
  onDispatch: () => void;
  onEscalate: () => void;
  busy: boolean;
  /** `dispatch_table` is manager+; kitchen reads this board but cannot act on it. */
  canDispatch: boolean;
}) {
  const { action } = row;
  return (
    <div className="text-right">
      {action.kind === 'dispatch' &&
        (canDispatch ? (
          <Button variant="primary" className="w-full" onClick={onDispatch} disabled={busy}>
            {busy ? 'Dispatching…' : action.label}
          </Button>
        ) : (
          <span className="flex w-full justify-center">
            <Chip variant="success" className="w-full justify-center">
              Ready · waiter to collect
            </Chip>
          </span>
        ))}
      {action.kind === 'escalate' && (
        <Button variant="alert" className="w-full" onClick={onEscalate}>
          {action.label}
        </Button>
      )}
      {action.kind === 'waiting' && (
        <span className="flex w-full justify-center">
          <Chip variant="muted" className="w-full justify-center">
            {action.label}
          </Chip>
        </span>
      )}
      <div className="mt-1.5">
        <SheetRef tracking="ref">{action.hint}</SheetRef>
      </div>
    </div>
  );
}

export default function ManagerKdsAggregate() {
  const { data: rows, isLoading, isError, refetch } = useAggregate();
  const dispatch = useDispatchTable();
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.user?.role);
  const canDispatch = role === 'manager' || role === 'owner';
  const [filter, setFilter] = useState<Station | 'all'>('all');

  const allRows = rows ?? [];
  const tallies = tallyStations(allRows);

  // Filtering to a station keeps the tables that actually have a live ticket there.
  const visible =
    filter === 'all'
      ? allRows
      : allRows.filter((r) => r.stations.some((l) => l.station === filter && isLive(l)));

  return (
    <ManagerShell
      title="KDS aggregate"
      refCode={`M-02 · ${allRows.length} active ${allRows.length === 1 ? 'order' : 'orders'}`}
      right={
        <>
          {tallies.length === 0 ? (
            <span className="font-mono text-[11px] text-muted">All stations clear</span>
          ) : (
            tallies.map((t) => (
              <span key={t.station} className="font-mono text-[11px] text-muted">
                <span className="uppercase">{t.station}</span> ·{' '}
                <strong className="text-ink">
                  {t.ready}/{t.total}
                </strong>{' '}
                ready
                {t.breached > 0 && <span className="text-alert"> · {t.breached} late</span>}
              </span>
            ))
          )}
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
              className={cn(
                'rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-ref',
                filter === 'all' ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-3 text-muted',
              )}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-paper align-middle" />
              All stations · {allRows.length}
            </button>
            {tallies.map((t) => (
              <button
                key={t.station}
                type="button"
                aria-pressed={filter === t.station}
                onClick={() => setFilter(t.station)}
                className={cn(
                  'rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-ref',
                  filter === t.station
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-paper-3 text-muted',
                )}
              >
                <span
                  className={cn(
                    'mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle',
                    STATION_DOT[t.station] ?? 'bg-line-strong',
                  )}
                />
                {t.station} · {t.total}
              </button>
            ))}
          </div>
          <SheetRef tracking="ref">Sort: readiness ↓</SheetRef>
        </div>

        {isError ? (
          <ErrorState label="open orders" onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-md bg-paper-3" />
            ))}
          </div>
        ) : allRows.length === 0 ? (
          <EmptyState message="No open orders across the stations." />
        ) : visible.length === 0 ? (
          <EmptyState message={`Nothing on ${filter} right now.`} />
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((row) => (
              <div
                key={row.tableRef}
                className={cn(
                  'relative grid grid-cols-[90px_1fr_1fr_1fr_140px] items-center gap-5 rounded-md border p-5',
                  row.rowState === 'ready' && 'border-[#B0D4C0] bg-success-2',
                  row.rowState === 'breach' && 'border-[#E5B4AE] bg-[#FDF0EE]',
                  row.rowState === 'normal' && 'border-line bg-paper-2',
                )}
              >
                {row.rowState === 'ready' && <CornerTicks />}
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] tracking-ref text-muted">{row.tableRef}</span>
                  <span
                    className={cn(
                      'font-display font-bold tracking-[-0.02em] text-ink',
                      row.tableNumber.length > 2 ? 'text-base' : 'text-[22px]',
                    )}
                  >
                    {row.tableNumber}
                  </span>
                </div>
                {row.stations.map((line) => (
                  <StationCol key={line.station} line={line} />
                ))}
                <ActionCell
                  row={row}
                  busy={dispatch.isPending && dispatch.variables === row.tableRef}
                  onDispatch={() => dispatch.mutate(row.tableRef)}
                  onEscalate={() =>
                    navigate(`/kds/${row.action.station ?? KNOWN_STATIONS[0]}`)
                  }
                  canDispatch={canDispatch}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagerShell>
  );
}

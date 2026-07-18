import { Check, Timer } from 'lucide-react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Chip } from '@/components/naqsha/Chip';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { AggregateRow, Station, StationLine } from '@/types/domain';
import { useAggregate } from '@/hooks/useAggregate';

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

const PILLS: { key: string; label: string; dot: string; active?: boolean }[] = [
  { key: 'all', label: 'All stations', dot: 'bg-paper', active: true },
  { key: 'drinks', label: 'Drinks · 4', dot: 'bg-station-drinks' },
  { key: 'main', label: 'Main · 5', dot: 'bg-amber' },
  { key: 'bbq', label: 'BBQ · 3', dot: 'bg-alert' },
];

function StationCol({ line }: { line: StationLine }) {
  return (
    <div className={cn('border-l-2 pl-4', STATION_BORDER[line.station])}>
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

function ActionCell({ row }: { row: AggregateRow }) {
  const { action } = row;
  return (
    <div className="text-right">
      {action.kind === 'dispatch' && (
        <Button variant="primary" className="w-full">
          {action.label}
        </Button>
      )}
      {action.kind === 'escalate' && (
        <Button variant="alert" className="w-full">
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
  const { data: rows, isLoading } = useAggregate();

  return (
    <ManagerShell
      title="KDS aggregate"
      refCode="M-02 · 7 active orders"
      right={
        <>
          <span className="font-mono text-[11px] text-muted">
            Drinks · <strong className="text-ink">2/3</strong> active
          </span>
          <span className="font-mono text-[11px] text-muted">
            Main · <strong className="text-ink">2/4</strong> active
          </span>
          <span className="font-mono text-[11px] text-muted">
            BBQ · <strong className="text-ink">2/2</strong> active{' '}
            <span className="text-alert">full</span>
          </span>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {PILLS.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={cn(
                  'rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-ref',
                  pill.active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-paper-3 text-muted',
                )}
              >
                <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle', pill.dot)} />
                {pill.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SheetRef tracking="ref">Sort: readiness ↓</SheetRef>
            <Button variant="ghost" size="sm">
              Filter
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-md bg-paper-3" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(rows ?? []).map((row) => (
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
                <ActionCell row={row} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagerShell>
  );
}

import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { KdsShell } from '@/components/layouts/KdsShell';
import { KotCard } from '@/components/kot/KotCard';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { cn } from '@/lib/utils';
import { clock, dayLabel } from '@/lib/format';
import type { Kot, Station } from '@/types/domain';
import { useKotStream } from '@/hooks/useKotStream';

const STATIONS: Station[] = ['drinks', 'main', 'bbq'];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Column({
  label,
  count,
  empty,
  children,
}: {
  label: string;
  count: number;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-ink-3 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-ink-3 px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-code text-line-2">{label}</span>
        <span className="font-display text-xl font-bold text-paper">
          {count.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {count === 0 && empty ? <EmptyState tone="dark" message={empty} /> : children}
      </div>
    </div>
  );
}

export default function KdsStation() {
  const { station } = useParams();
  const now = useClock();
  const isValid = STATIONS.includes(station as Station);
  const { data: board, isLoading, isError, refetch } = useKotStream(
    (station as Station) ?? 'drinks',
  );

  if (!isValid) return <Navigate to="/kds/drinks" replace />;

  if (isError) {
    return (
      <KdsShell head={<span className="font-mono text-sm text-muted-2">Station unavailable</span>}>
        <div className="grid flex-1 place-items-center">
          <ErrorState tone="dark" label="the station board" onRetry={() => void refetch()} />
        </div>
      </KdsShell>
    );
  }

  if (isLoading || !board) {
    return (
      <KdsShell head={<span className="font-mono text-sm text-muted-2">Loading station…</span>}>
        <div className="grid flex-1 grid-cols-[1fr_1.4fr_1fr] gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-md border border-ink-3 bg-white/[0.03]" />
          ))}
        </div>
      </KdsShell>
    );
  }

  const { meta, queue, active, prepared } = board;
  const freeSlots = Math.max(0, meta.activeMax - active.length);

  return (
    <KdsShell
      head={
        <>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold tracking-[-0.01em]">{meta.name}</span>
            <span className="font-mono text-xs text-saffron">
              K-01 · station id: {meta.stationId}
            </span>
          </div>
          <div className="font-mono text-xs text-line-2">
            Active <strong className="font-semibold text-paper">{active.length}/{meta.activeMax}</strong> ·
            Queue <strong className="font-semibold text-paper">{queue.length}</strong> ·
            Prepared <strong className="font-semibold text-paper">{prepared.length}</strong>
          </div>
          <div className="font-mono text-sm text-muted-2">
            {clock(now)} · {dayLabel(now)}
          </div>
        </>
      }
      footer={
        <>
          <span>
            Avg prep time today · <strong className="text-paper">{meta.avgPrepLabel}</strong>
          </span>
          <span>
            SLA compliance · <strong className="text-paper">{meta.slaCompliancePct}%</strong>
          </span>
          <span>
            Total prepared · <strong className="text-paper">{meta.totalPrepared}</strong>
          </span>
          <span className="text-saffron">Connected · realtime</span>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.4fr_1fr] gap-4">
        <Column label="Queue" count={queue.length} empty="Queue is clear.">
          {queue.map((kot: Kot) => (
            <KotCard key={kot.ref} kot={kot} />
          ))}
        </Column>

        <Column label={`Active · max ${meta.activeMax}`} count={active.length}>
          {active.map((kot: Kot) => (
            <KotCard key={kot.ref} kot={kot} />
          ))}
          {freeSlots > 0 && (
            <div
              className={cn(
                'rounded border border-dashed border-ink-3 px-3 py-10 text-center',
                'font-mono text-[11px] tracking-ref text-muted-2',
              )}
            >
              Slot {meta.activeMax - freeSlots + 1} available
              <br />
              <span className="text-saffron">tap top of queue to start</span>
            </div>
          )}
        </Column>

        <Column
          label="Prepared · awaiting pickup"
          count={prepared.length}
          empty="Nothing awaiting pickup."
        >
          {prepared.map((kot: Kot) => (
            <KotCard key={kot.ref} kot={kot} />
          ))}
        </Column>
      </div>
    </KdsShell>
  );
}

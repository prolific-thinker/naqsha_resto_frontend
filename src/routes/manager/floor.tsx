import { useNavigate } from 'react-router-dom';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { StatTile } from '@/components/naqsha/StatTile';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { TableCard } from '@/components/table/TableCard';
import { useManagerTables } from '@/hooks/useOpenTables';
import { useFloorStats } from '@/hooks/useFloorStats';
import { duration, money } from '@/lib/format';
import type { SrvFloorStats } from '@/types/server';

type Tile = {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'down' | 'muted';
};

/**
 * The stat strip, derived from `floor.stats`.
 *
 * Every one of these was a hard-coded literal — "14 active orders", "SLA breaches 2 ·
 * T-03 (BBQ)" — on a floor showing two occupied tables and a free T-03. A strip that
 * does not move while the floor does is read as live and is not, which is worse than
 * showing nothing.
 */
function buildTiles(s: SrvFloorStats | undefined): Tile[] {
  const dash = '—';
  return [
    {
      label: 'Active orders',
      value: s ? String(s.activeOrders) : dash,
      delta: s ? `${s.openTables} of ${s.totalTables} tables open` : 'loading…',
      tone: 'muted',
    },
    {
      label: 'Avg prep time',
      value: s && s.avgPrepSeconds ? duration(s.avgPrepSeconds) : dash,
      delta: s && s.avgPrepSeconds ? 'across tickets prepared today' : 'nothing prepared yet today',
      tone: 'muted',
    },
    {
      label: 'SLA breaches',
      value: s ? String(s.slaBreaches) : dash,
      delta: s?.breachLabels.length ? s.breachLabels.join(' · ') : 'all tickets within SLA',
      tone: s && s.slaBreaches > 0 ? 'down' : 'up',
    },
    {
      label: 'Feedback due',
      value: s ? String(s.feedbackDue) : dash,
      delta: s?.feedbackDue ? 'awaiting a rating' : 'nothing outstanding',
      tone: 'muted',
    },
    {
      label: 'Wastage today',
      value: s ? `₨ ${money(s.wastageValue)}` : dash,
      delta: s ? `${s.wastageCount} ${s.wastageCount === 1 ? 'entry' : 'entries'}` : 'loading…',
      tone: 'muted',
    },
  ];
}

export default function ManagerFloor() {
  const navigate = useNavigate();
  const { data: tables, isLoading, isError, refetch } = useManagerTables();
  const { data: stats } = useFloorStats();

  return (
    <ManagerShell
      title="Floor"
      refCode="M-01"
      right={
        <>
          <span className="font-mono text-[11px] text-muted">
            Open tables · <strong className="text-ink">{stats?.openTables ?? '—'}</strong> /{' '}
            {stats?.totalTables ?? '—'}
          </span>
          <span className="font-mono text-[11px] text-muted">
            Revenue today · <strong className="text-ink">₨ {money(stats?.sessionRevenue ?? 0)}</strong>
          </span>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {buildTiles(stats).map((tile) => (
            <StatTile
              key={tile.label}
              label={tile.label}
              value={tile.value}
              delta={tile.delta}
              deltaTone={tile.tone}
            />
          ))}
        </div>

        {isError ? (
          <ErrorState label="the floor" onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="min-h-[130px] animate-pulse rounded-md bg-paper-3" />
            ))}
          </div>
        ) : (tables ?? []).length === 0 ? (
          <EmptyState message="No open tables yet this session." />
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {(tables ?? []).map((table) => (
              <TableCard
                key={table.ref}
                table={table}
                variant="manager"
                onClick={() =>
                  table.state !== 'free' ? navigate(`/manager/pos/${table.ref}`) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </ManagerShell>
  );
}

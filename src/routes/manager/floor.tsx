import { useNavigate } from 'react-router-dom';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { StatTile } from '@/components/naqsha/StatTile';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { TableCard } from '@/components/table/TableCard';
import { Button } from '@/components/ui/Button';
import { useManagerTables } from '@/hooks/useOpenTables';

type Tile = {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'down' | 'muted';
};

const FLOOR_STATS: Tile[] = [
  { label: 'Active orders', value: '14', delta: '↑ 3 vs same time yesterday', tone: 'up' },
  { label: 'Avg prep time', value: '08:14', delta: '↓ 00:44 vs 7-day avg', tone: 'up' },
  { label: 'SLA breaches', value: '2', delta: 'T-03 (BBQ) · T-01 (Main)', tone: 'down' },
  { label: 'Feedback due', value: '3', delta: 'T-02 · T-06 · TAKE-041', tone: 'muted' },
  { label: 'Wastage today', value: '₨ 1,240', delta: '2 entries · 1 pending', tone: 'muted' },
];

export default function ManagerFloor() {
  const navigate = useNavigate();
  const { data: tables, isLoading, isError, refetch } = useManagerTables();

  return (
    <ManagerShell
      title="Floor"
      refCode="M-01 · Session S-2026-198"
      right={
        <>
          <span className="font-mono text-[11px] text-muted">
            Open tables · <strong className="text-ink">7</strong> / 10
          </span>
          <span className="font-mono text-[11px] text-muted">
            Takeaway · <strong className="text-ink">2</strong> in progress
          </span>
          <span className="font-mono text-[11px] text-muted">
            Session revenue · <strong className="text-ink">₨ 47,320</strong>
          </span>
          <Button variant="ghost" size="sm">
            End session
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-5 grid grid-cols-5 gap-3">
          {FLOOR_STATS.map((tile) => (
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

import { useNavigate } from 'react-router-dom';
import { WaiterShell } from '@/components/layouts/WaiterShell';
import { TableCard } from '@/components/table/TableCard';
import { Chip } from '@/components/naqsha/Chip';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSessionMeta } from '@/hooks/useSessionMeta';
import { useTakeawayOrders, useWaiterTables } from '@/hooks/useOpenTables';

function Tabs({ mineCount }: { mineCount: number }) {
  const tab = 'grid flex-1 place-items-center rounded font-display text-[13px] font-medium';
  return (
    <div className="mx-6 mt-5 flex h-11 gap-1 rounded-md bg-paper-3 p-1">
      <div className={cn(tab, 'bg-paper text-ink shadow-sm')}>Floor</div>
      <div className={cn(tab, 'text-muted')}>
        My tables <span className="ml-1.5 font-mono text-[11px] text-muted">{mineCount}</span>
      </div>
      <div className={cn(tab, 'text-muted')}>Menu</div>
    </div>
  );
}

function Legend() {
  const swatch = 'mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border align-middle';
  return (
    <div className="mx-6 mb-3 mt-5 flex items-center gap-5 font-mono text-[10px] uppercase tracking-ref text-muted">
      <span>
        <span className={cn(swatch, 'border-line bg-paper-2')} />
        Free
      </span>
      <span>
        <span className={cn(swatch, 'border-teal bg-[#F1F7F7]')} />
        Mine
      </span>
      <span>
        <span className={cn(swatch, 'border-line-strong bg-paper-3')} />
        Other waiter
      </span>
      <span className="ml-auto">Updated 20:14:22</span>
    </div>
  );
}

export default function WaiterFloor() {
  const navigate = useNavigate();
  const session = useSessionMeta('waiter');
  const { data: tables, isLoading, isError, refetch } = useWaiterTables();
  const { data: takeaway } = useTakeawayOrders();

  const mineCount = (tables ?? []).filter((t) => t.state === 'mine').length;
  const avatar = session.waiter?.name.charAt(0) ?? 'W';

  return (
    <WaiterShell
      left={<Chip variant="muted">{session.branchLabel}</Chip>}
      right={
        <>
          <SheetRef tracking="ref">Waiter · {session.waiter?.id}</SheetRef>
          <span className="font-mono text-xs text-muted">{session.shiftLabel}</span>
          <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-teal font-display text-[13px] font-semibold text-paper">
            {avatar}
          </div>
        </>
      }
      tabs={<Tabs mineCount={mineCount} />}
    >
      <div className="h-full overflow-y-auto pb-6">
        <Legend />

        {isError ? (
          <div className="px-6">
            <ErrorState label="the floor" onRetry={() => void refetch()} />
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-5 gap-3 px-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="min-h-[96px] animate-pulse rounded-md bg-paper-3" />
            ))}
          </div>
        ) : (tables ?? []).length === 0 ? (
          <div className="px-6">
            <EmptyState message="No open tables — the floor is clear." />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 px-6">
            {(tables ?? []).map((table) => (
              <TableCard
                key={table.ref}
                table={table}
                variant="waiter"
                onClick={() => navigate(`/waiter/tables/${table.ref}`)}
              />
            ))}
          </div>
        )}

        <div className="mx-6 mt-5 flex items-center justify-between rounded-md border border-dashed border-line-strong bg-paper-3 px-5 py-[18px]">
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-saffron font-display text-lg font-bold text-ink">
              TA
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-ink">Takeaway / walk-in</div>
              <div className="mt-0.5 font-mono text-[11px] text-muted">
                {takeaway?.length ?? 0} in progress · {(takeaway ?? []).map((t) => t.ref).join(', ')}
              </div>
            </div>
          </div>
          <Button variant="primary">Start takeaway order →</Button>
        </div>
      </div>
    </WaiterShell>
  );
}

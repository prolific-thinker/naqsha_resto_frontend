import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WaiterShell } from '@/components/layouts/WaiterShell';
import { TableCard } from '@/components/table/TableCard';
import { useOpenTable } from '@/hooks/useActions';
import { Chip } from '@/components/naqsha/Chip';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { pkr } from '@/lib/format';
import { useSessionMeta } from '@/hooks/useSessionMeta';
import { useTakeawayOrders, useWaiterTables } from '@/hooks/useOpenTables';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { elapsedSecondsSince, useNow } from '@/hooks/useNow';
import { humanDuration } from '@/lib/api/adapters/shared';
import type { Table } from '@/types/domain';

type TabKey = 'floor' | 'mine' | 'menu';

/**
 * The waiter tablet's three views. `Floor` is the whole room; `My tables` is the
 * subset this waiter owns, as a working list rather than a seating chart; `Menu`
 * is read-only reference for answering "do you have…" without opening a table.
 */
function Tabs({
  active,
  onChange,
  mineCount,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  mineCount: number;
}) {
  const base = 'grid flex-1 place-items-center rounded font-display text-[13px] font-medium';
  const items: { key: TabKey; label: React.ReactNode }[] = [
    { key: 'floor', label: 'Floor' },
    {
      key: 'mine',
      label: (
        <span>
          My tables <span className="ml-1.5 font-mono text-[11px] opacity-70">{mineCount}</span>
        </span>
      ),
    },
    { key: 'menu', label: 'Menu' },
  ];

  return (
    <div className="mx-6 mt-5 flex h-11 gap-1 rounded-md bg-paper-3 p-1" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          onClick={() => onChange(item.key)}
          className={cn(base, active === item.key ? 'bg-paper text-ink shadow-sm' : 'text-muted')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Legend({ updatedAt }: { updatedAt?: number }) {
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
      {/* Was a hard-coded "20:14:22". A frozen clock on a live floor screen is worse
          than no clock — it tells a waiter the board is current when it may not be. */}
      <span className="ml-auto">
        {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString('en-GB')}` : 'Updating…'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My tables
// ---------------------------------------------------------------------------

/** States that mean "this waiter is on the hook for it", in the order they matter. */
const MINE_PRIORITY: Record<string, number> = { breach: 0, ready: 1, billing: 2, active: 3, mine: 4 };

function MyTablesTab({ tables, onOpen }: { tables: Table[]; onOpen: (t: Table) => void }) {
  const now = useNow(15_000);

  const mine = useMemo(
    () =>
      tables
        .filter((t) => t.isMine)
        .sort((a, b) => (MINE_PRIORITY[a.state] ?? 9) - (MINE_PRIORITY[b.state] ?? 9)),
    [tables],
  );

  if (mine.length === 0) {
    return (
      <div className="px-6">
        <EmptyState message="No tables open under your name. Take one from the Floor tab." />
      </div>
    );
  }

  const total = mine.reduce((s, t) => s + (t.amount ?? 0), 0);
  const covers = mine.reduce((s, t) => s + (t.pax ?? 0), 0);

  return (
    <div className="px-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-ref text-muted">
        <span>
          {mine.length} {mine.length === 1 ? 'table' : 'tables'}
        </span>
        <span>{covers} covers</span>
        <span className="text-ink">running {pkr(total)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {mine.map((t) => {
          const openFor = t.openedAt ? humanDuration(elapsedSecondsSince(t.openedAt, now)) : null;
          return (
            <button
              key={t.ref}
              type="button"
              onClick={() => onOpen(t)}
              className={cn(
                'grid w-full items-center gap-4 rounded-md border px-5 py-4 text-left',
                'grid-cols-[70px_1fr_110px_120px_130px] hover:border-line-strong',
                t.state === 'breach'
                  ? 'border-[#E5B4AE] bg-[#FDF0EE]'
                  : t.state === 'ready'
                    ? 'border-[#B0D4C0] bg-success-2'
                    : 'border-line bg-paper-2',
              )}
            >
              <span>
                <span className="font-mono text-[10px] uppercase tracking-ref text-muted">{t.ref}</span>
                <span className="block font-display text-xl font-bold text-ink">{t.number}</span>
              </span>
              <span>
                <span className="block text-[13px] text-ink">{t.meta ?? 'seated'}</span>
                {t.actionTag && (
                  <span
                    className={cn(
                      'mt-0.5 block font-mono text-[10px] uppercase tracking-ref',
                      t.state === 'breach' ? 'text-alert' : t.state === 'ready' ? 'text-success' : 'text-muted',
                    )}
                  >
                    {t.actionTag}
                  </span>
                )}
              </span>
              <span className="font-mono text-[12px] text-muted">
                {t.pax ? `${t.pax} pax` : '—'}
              </span>
              <span className="font-mono text-[12px] text-muted">
                {openFor ? `open ${openFor}` : '—'}
                {t.openedAtLabel && <span className="block text-[10px]">since {t.openedAtLabel}</span>}
              </span>
              <span className="flex items-center justify-end gap-3">
                <span className="font-mono text-[13px] font-semibold text-ink">
                  {t.amount ? pkr(t.amount) : '—'}
                </span>
                {t.statusTag && <Chip variant={t.statusTag.tone}>{t.statusTag.label}</Chip>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

/**
 * Read-only. Ordering happens against a table, and this tab has none — a waiter
 * standing at a table opens it from Floor and gets the cart. What they need here is
 * "is the fish tikka still on?", which is a question about the menu, not an order.
 */
function MenuTab() {
  const categories = useMenuCategories();
  const items = useMenuItems();
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState('');

  if (items.isError || categories.isError) {
    return (
      <div className="px-6">
        <ErrorState
          label="the menu"
          onRetry={() => {
            void items.refetch();
            void categories.refetch();
          }}
        />
      </div>
    );
  }
  if (items.isLoading || categories.isLoading) {
    return (
      <div className="grid gap-2 px-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-paper-3" />
        ))}
      </div>
    );
  }

  const all = items.data ?? [];
  const needle = q.trim().toLowerCase();
  const shown = all.filter(
    (i) =>
      (!category || i.categoryId === category) &&
      (!needle || i.name.toLowerCase().includes(needle) || i.id.toLowerCase().includes(needle)),
  );
  const off = all.filter((i) => i.outOfStock).length;

  return (
    <div className="px-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input placeholder="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-ref text-muted">
          {shown.length} of {all.length}
          {off > 0 && <span className="ml-3 text-alert">{off} off menu</span>}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <CategoryPill label="All" active={category === null} onClick={() => setCategory(null)} />
        {(categories.data ?? []).map((c) => (
          <CategoryPill
            key={c.id}
            label={`${c.name} ${c.count}`}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState message={needle ? `Nothing matches “${q}”.` : 'No items in this category.'} />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {shown.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start justify-between gap-4 rounded-md border px-4 py-3',
                item.outOfStock ? 'border-[#E5B4AE] bg-[#FDF0EE]' : 'border-line bg-paper-2',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', item.outOfStock ? 'text-muted line-through' : 'text-ink')}>
                    {item.name}
                  </span>
                  {item.outOfStock && <Chip variant="alert">86</Chip>}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-ref text-muted">
                  {item.id} · {item.station}
                </div>
                {item.outOfStock && item.outOfStockReason && (
                  <div className="mt-1 text-[12px] text-alert">{item.outOfStockReason}</div>
                )}
                {!item.outOfStock && item.description && (
                  <div className="mt-1 line-clamp-1 text-[12px] text-muted">{item.description}</div>
                )}
              </div>
              <span className="shrink-0 font-mono text-[13px] font-semibold text-ink">{pkr(item.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 font-body text-[12px]',
        active ? 'border-teal bg-teal text-paper' : 'border-line-strong bg-paper text-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------

export default function WaiterFloor() {
  const navigate = useNavigate();
  const openTable = useOpenTable();
  const [tab, setTab] = useState<TabKey>('floor');

  // Which table is being opened, and for how many. Covers used to be hard-coded to 2:
  // every table in the restaurant opened as a party of two regardless of who sat down,
  // so covers, revenue-per-cover and the bill's "avg per person" were wrong on every
  // session. The waiter is standing at the table — ask them.
  const [opening, setOpening] = useState<{ ref: string; seats?: number } | null>(null);

  /**
   * A free table has no session, so ordering against it would be rejected with
   * TABLE_NOT_OPEN. Open it first, then go to the cart. Anything already open goes
   * straight through — open_table would answer TABLE_OCCUPIED.
   */
  const goToTable = async (ref: string, state: string, seats?: number) => {
    if (state === 'free') {
      setOpening({ ref, seats });
      return;
    }
    navigate(`/waiter/tables/${ref}`);
  };

  const confirmOpen = async (pax: number) => {
    if (!opening) return;
    const { ref } = opening;
    setOpening(null);
    await openTable.mutateAsync({ table: ref, pax }).catch(() => undefined);
    navigate(`/waiter/tables/${ref}`);
  };

  const session = useSessionMeta('waiter');
  const { data: tables, isLoading, isError, refetch, dataUpdatedAt } = useWaiterTables();
  const { data: takeaway } = useTakeawayOrders();

  const rows = tables ?? [];
  const mineCount = rows.filter((t) => t.isMine).length;
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
      tabs={<Tabs active={tab} onChange={setTab} mineCount={mineCount} />}
    >
      <div className="h-full overflow-y-auto pb-6">
        {tab === 'menu' ? (
          <div className="pt-5">
            <MenuTab />
          </div>
        ) : isError ? (
          <div className="px-6 pt-5">
            <ErrorState label="the floor" onRetry={() => void refetch()} />
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-5 gap-3 px-6 pt-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="min-h-[96px] animate-pulse rounded-md bg-paper-3" />
            ))}
          </div>
        ) : tab === 'mine' ? (
          <div className="pt-5">
            <MyTablesTab tables={rows} onOpen={(t) => void goToTable(t.ref, t.state, t.seats)} />
          </div>
        ) : (
          <>
            <Legend updatedAt={dataUpdatedAt} />
            {rows.length === 0 ? (
              <div className="px-6">
                <EmptyState message="No tables configured for this branch." />
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3 px-6">
                {rows.map((table) => (
                  <TableCard
                    key={table.ref}
                    table={table}
                    variant="waiter"
                    onClick={() => void goToTable(table.ref, table.state, table.seats)}
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
                    {takeaway?.length ?? 0} in progress
                    {(takeaway ?? []).length > 0 && ` · ${(takeaway ?? []).map((t) => t.ref).join(', ')}`}
                  </div>
                </div>
              </div>
              {/* No backend read or write for takeaway in v1 (see lib/api/orders.ts).
                  Disabled and labelled rather than left as a button that does nothing. */}
              <Button variant="primary" disabled title="Takeaway ordering lands in v1.1">
                Start takeaway order →
              </Button>
            </div>
          </>
        )}
      </div>

      {opening && (
        <CoversDialog
          tableRef={opening.ref}
          seats={opening.seats}
          busy={openTable.isPending}
          onConfirm={(pax) => void confirmOpen(pax)}
          onCancel={() => setOpening(null)}
        />
      )}
    </WaiterShell>
  );
}

/**
 * How many people sat down. Big targets — this is the first thing a waiter taps on a
 * tablet, standing up, usually one-handed.
 */
function CoversDialog({
  tableRef,
  seats,
  busy,
  onConfirm,
  onCancel,
}: {
  tableRef: string;
  seats?: number;
  busy: boolean;
  onConfirm: (pax: number) => void;
  onCancel: () => void;
}) {
  // Defaults to the table's own size, which is right more often than any constant.
  const [pax, setPax] = useState(seats && seats > 0 ? seats : 2);
  const options = [1, 2, 3, 4, 5, 6, 8, 10, 12];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Open ${tableRef}`}
    >
      <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 shadow-xl">
        <div className="font-mono text-[10px] uppercase tracking-ref text-muted">{tableRef}</div>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">How many covers?</h3>
        <p className="mt-1 text-[13px] text-muted">
          {seats ? `${seats}-top` : 'Table'} · this sets the covers on the bill.
        </p>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={pax === n}
              onClick={() => setPax(n)}
              className={cn(
                'rounded border py-3 font-display text-base font-semibold',
                pax === n ? 'border-teal bg-teal text-paper' : 'border-line-strong bg-paper-2 text-ink',
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => onConfirm(pax)}>
            {busy ? 'Opening…' : `Open for ${pax}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

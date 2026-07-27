import { useMemo, useState } from 'react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Tabs } from '@/components/naqsha/Tabs';
import { Chip, type ChipVariant } from '@/components/naqsha/Chip';
import { DataRow } from '@/components/naqsha/DataRow';
import { StatTile } from '@/components/naqsha/StatTile';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { PeriodPicker } from '@/components/naqsha/PeriodPicker';
import { FormDialog, Field } from '@/components/naqsha/FormDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { money, cost } from '@/lib/format';
import { useStockLevels, useBoms, useCogsSummary, useAdjustStock, type Period } from '@/hooks/useErp';
import { isFailure } from '@/lib/api/http';
import type { StockRow, StockStatus } from '@/types/erp';

const TABS = [
  { key: 'stock', code: 'I-1', label: 'Stock levels' },
  { key: 'recipes', code: 'I-2', label: 'Recipes / BOM' },
  { key: 'cogs', code: 'I-3', label: 'Food cost %' },
];

const STOCK_CHIP: Record<StockStatus, { variant: ChipVariant; label: string }> = {
  ok: { variant: 'success', label: 'in stock' },
  low: { variant: 'amber', label: 'low' },
  out: { variant: 'alert', label: 'out' },
};

// ---------------------------------------------------------------------------
// I-1 · Stock levels
// ---------------------------------------------------------------------------

function StockTab() {
  const { data, isLoading, isError, refetch } = useStockLevels();
  const [adjusting, setAdjusting] = useState(false);

  if (isError) return <ErrorState label="stock levels" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];
  const low = rows.filter((r) => r.status !== 'ok').length;
  const value = rows.reduce((s, r) => s + r.actualQty * r.valuationRate, 0);
  const warehouses = new Set(rows.map((r) => r.warehouse));

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Tracked items" value={String(rows.length)} />
        <StatTile
          label="Low / out"
          value={String(low)}
          delta={low ? 'need reorder' : 'all above level'}
          deltaTone={low ? 'down' : 'up'}
        />
        <StatTile label="Stock value" value={`₨ ${money(value)}`} />
        <StatTile
          label="Warehouse"
          value={String(warehouses.size)}
          delta={[...warehouses][0]?.replace(/ - \w+$/, '') ?? '—'}
        />
      </div>

      <div className="mb-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setAdjusting(true)}>
          + Stock adjustment
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No stock-tracked items in this warehouse yet." />
      ) : (
        <>
          <DataRow header cols="130px 1fr 150px 110px 100px 110px 90px">
            <span>Code</span>
            <span>Ingredient</span>
            <span>Warehouse</span>
            <span className="text-right">On hand</span>
            <span className="text-right">Reorder</span>
            <span className="text-right">Val. rate</span>
            <span className="text-right">Status</span>
          </DataRow>
          {rows.map((r) => (
            <DataRow key={`${r.code}:${r.warehouse}`} cols="130px 1fr 150px 110px 100px 110px 90px">
              <span className="font-mono text-[11px] text-muted">{r.code}</span>
              <span className="font-medium text-ink">{r.name}</span>
              <span className="text-muted">{r.warehouse}</span>
              <span className="text-right font-mono font-semibold">
                {r.actualQty} {r.uom}
              </span>
              <span className="text-right font-mono text-muted">
                {r.reorderLevel ? `${r.reorderLevel} ${r.uom}` : '—'}
              </span>
              <span className="text-right font-mono text-muted">₨ {money(r.valuationRate)}</span>
              <span className="flex justify-end">
                <Chip variant={STOCK_CHIP[r.status].variant}>{STOCK_CHIP[r.status].label}</Chip>
              </span>
            </DataRow>
          ))}
        </>
      )}

      {adjusting && <AdjustDialog rows={rows} onClose={() => setAdjusting(false)} />}
    </div>
  );
}

function AdjustDialog({ rows, onClose }: { rows: StockRow[]; onClose: () => void }) {
  const adjust = useAdjustStock();
  const [purpose, setPurpose] = useState<'Material Receipt' | 'Material Issue'>('Material Receipt');
  const [code, setCode] = useState(rows[0]?.code ?? '');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = rows.find((r) => r.code === code);
  const options = useMemo(
    () => rows.map((r) => ({ value: r.code, label: `${r.name} · ${r.actualQty} ${r.uom}` })),
    [rows],
  );

  const submit = () => {
    setError(null);
    const amount = Number(qty);
    if (!code || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }
    // A Material Issue larger than what is on hand posts negative stock, which
    // ERPNext will either refuse or accept and then poison the valuation with.
    // Cheaper to catch here than to explain a negative Bin later.
    if (purpose === 'Material Issue' && selected && amount > selected.actualQty) {
      setError(`Only ${selected.actualQty} ${selected.uom} on hand.`);
      return;
    }

    adjust.mutate(
      { purpose, items: [{ code, qty: amount }], warehouse: selected?.warehouse, note: note || undefined },
      {
        onSuccess: (res) => (isFailure(res) ? setError(res.message) : onClose()),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not post the entry.'),
      },
    );
  };

  return (
    <FormDialog
      title="Stock adjustment"
      refCode="I-1 · Stock Entry"
      submitLabel="Post entry"
      onSubmit={submit}
      onClose={onClose}
      busy={adjust.isPending}
      error={error}
      disabled={rows.length === 0}
    >
      <Field label="Purpose">
        <Select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as 'Material Receipt' | 'Material Issue')}
          options={[
            { value: 'Material Receipt', label: 'Material Receipt — stock in' },
            { value: 'Material Issue', label: 'Material Issue — stock out' },
          ]}
        />
      </Field>
      <Field label="Item">
        <Select value={code} onChange={(e) => setCode(e.target.value)} options={options} />
      </Field>
      <Field label="Quantity" hint={selected ? `in ${selected.uom}` : undefined}>
        <Input type="number" step="0.01" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Reason" hint="optional">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Weekly count correction" />
      </Field>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// I-2 · Recipes
// ---------------------------------------------------------------------------

function RecipesTab() {
  const { data, isLoading, isError, refetch } = useBoms();
  if (isError) return <ErrorState label="recipes" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const boms = data ?? [];
  if (boms.length === 0) {
    return <EmptyState message="No active recipes. Create a BOM in Desk for a dish to cost it here." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {boms.map((b) => (
        <div key={b.id} className="relative rounded-md border border-line bg-paper-2 p-5">
          <CornerTicks />
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-ref text-muted">{b.id}</div>
              <h4 className="mt-1 font-display text-base font-semibold text-ink">{b.itemName}</h4>
              {/* Everything below is per portion — the batch yields b.portions. */}
              <div className="font-mono text-[10px] text-muted">
                per portion · batch of {b.portions}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-ref text-muted">food cost</div>
              <div
                className={
                  b.foodCostPct > 35
                    ? 'font-display text-xl font-bold text-alert'
                    : 'font-display text-xl font-bold text-ink'
                }
              >
                {b.foodCostPct}%
              </div>
            </div>
          </div>
          <div className="mt-4">
            <DataRow header cols="1fr 100px 90px">
              <span>Ingredient</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Cost</span>
            </DataRow>
            {b.lines.map((l, i) => (
              <DataRow key={i} cols="1fr 100px 90px" className="py-2">
                <span className="text-ink">{l.name}</span>
                <span className="text-right font-mono text-muted">
                  {l.qty} {l.uom}
                </span>
                <span className="text-right font-mono">{cost(l.amount)}</span>
              </DataRow>
            ))}
            <div className="mt-2 flex justify-between text-[13px]">
              <span className="text-muted">Cost · sell price</span>
              <span className="font-mono font-semibold text-ink">
                ₨ {money(b.totalCost)} · ₨ {money(b.sellPrice)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// I-3 · Food cost
// ---------------------------------------------------------------------------

function CogsTab({ period, onPeriod }: { period: Period; onPeriod: (p: Period) => void }) {
  const { data, isLoading, isError, refetch } = useCogsSummary(period);

  if (isError) return <ErrorState label="food-cost summary" onRetry={() => void refetch()} />;

  const uncostedPct =
    data && data.revenue ? Math.round(((data.uncostedRevenue ?? 0) / data.revenue) * 100) : 0;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <PeriodPicker value={period} onChange={onPeriod} />
      </div>

      {isLoading || !data ? (
        <Skeleton />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Revenue" value={`₨ ${money(data.revenue)}`} delta={data.periodLabel} />
            <StatTile label="COGS" value={`₨ ${money(data.cogs)}`} deltaTone="down" delta="cost of goods" />
            <StatTile
              label="Food cost %"
              value={`${data.foodCostPct}%`}
              delta="target < 35%"
              deltaTone={data.foodCostPct <= 35 ? 'up' : 'down'}
            />
            <StatTile label="Gross profit" value={`₨ ${money(data.grossProfit)}`} deltaTone="up" />
          </div>

          {/* Not a warning to be dismissed: a food-cost figure computed over lines that
              have no recipe and no valuation is optimistic by exactly this much. */}
          {uncostedPct > 0 && (
            <p className="mb-4 rounded border border-amber/40 bg-amber/5 px-3 py-2 text-[12px] text-muted">
              {uncostedPct}% of revenue (₨ {money(data.uncostedRevenue ?? 0)}) came from items with no
              recipe or valuation, so their cost is counted as zero. Add a BOM to include them.
            </p>
          )}

          <h4 className="mb-3 font-display text-sm font-semibold text-ink">Cost by category</h4>
          {data.byCategory.length === 0 ? (
            <EmptyState message="Nothing sold in this period." />
          ) : (
            <>
              <DataRow header cols="1fr 140px 120px">
                <span>Category</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Share of COGS</span>
              </DataRow>
              {data.byCategory.map((c) => (
                <DataRow key={c.category} cols="1fr 140px 120px">
                  <span className="text-ink">{c.category}</span>
                  <span className="text-right font-mono">₨ {money(c.cost)}</span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="h-1.5 w-16 overflow-hidden rounded bg-paper-3">
                      <span className="block h-full bg-teal" style={{ width: `${c.pct}%` }} />
                    </span>
                    <span className="font-mono text-muted">{c.pct}%</span>
                  </span>
                </DataRow>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-paper-3" />
      ))}
    </div>
  );
}

export default function ManagerInventory() {
  const [tab, setTab] = useState('stock');
  const [period, setPeriod] = useState<Period>('week');
  return (
    <ManagerShell title="Inventory & supply" refCode="I-01">
      <div className="border-b border-line bg-paper-2 px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="border-b-0" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === 'stock' && <StockTab />}
        {tab === 'recipes' && <RecipesTab />}
        {tab === 'cogs' && <CogsTab period={period} onPeriod={setPeriod} />}
      </div>
    </ManagerShell>
  );
}

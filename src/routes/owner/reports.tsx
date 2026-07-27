import { useState } from 'react';
import { OwnerShell } from '@/components/layouts/OwnerShell';
import { Tabs } from '@/components/naqsha/Tabs';
import { StatTile } from '@/components/naqsha/StatTile';
import { DataRow } from '@/components/naqsha/DataRow';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { PeriodPicker } from '@/components/naqsha/PeriodPicker';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { usePnlReport, useItemPerformance, useBranchReport, type Period } from '@/hooks/useErp';

const TABS = [
  { key: 'pnl', code: 'O-3', label: 'Sales & P&L' },
  { key: 'items', code: 'O-4', label: 'Item performance' },
  { key: 'branches', code: 'O-5', label: 'Multi-branch' },
];

/** Tallest bar in the revenue chart, in px. */
const CHART_HEIGHT = 140;

// ---------------------------------------------------------------------------
// O-3 · Sales & P&L
// ---------------------------------------------------------------------------

function PnlTab({ period }: { period: Period }) {
  const { data, isLoading, isError, refetch } = usePnlReport(period);
  if (isError) return <ErrorState label="P&L report" onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Skeleton />;

  const peak = data.trend.reduce((m, t) => Math.max(m, t.revenue), 0);
  const best = data.trend.find((t) => t.revenue === peak && peak > 0);
  const revenue = data.lines.find((l) => /revenue/i.test(l.label))?.value ?? 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Net profit"
          value={`₨ ${money(data.netProfit)}`}
          delta={data.deltaLabel}
          deltaTone={data.deltaTone}
        />
        <StatTile label="Revenue" value={`₨ ${money(revenue)}`} delta={data.periodLabel} />
        <StatTile
          label="Best day"
          value={peak ? `₨ ${money(peak)}` : '—'}
          delta={best?.label ?? 'no sales'}
          deltaTone={peak ? 'up' : 'muted'}
        />
        <StatTile label="Days" value={String(data.trend.length)} delta="in window" />
      </div>

      <div className="relative mb-6 rounded-md border border-line bg-paper-2 p-6">
        <CornerTicks />
        <h4 className="mb-4 font-display text-sm font-semibold text-ink">Revenue by day</h4>
        {peak === 0 ? (
          <EmptyState message="No sales posted in this period." />
        ) : (
          <div className="flex items-end gap-3 overflow-x-auto">
            {data.trend.map((t) => (
              <div key={t.label} className="flex min-w-[36px] flex-1 flex-col items-center gap-2">
                <div
                  className={cn('w-full rounded-t', t.revenue === peak ? 'bg-saffron' : 'bg-teal')}
                  // Pixels, not a percentage. A percentage height resolves against the
                  // parent's *definite* height, and inside a flex column there is none —
                  // every bar computes to 0 and the chart renders as a bare axis.
                  // A closed day gets a 2px floor so the axis stays continuous.
                  style={{ height: Math.max(2, Math.round((t.revenue / peak) * CHART_HEIGHT)) }}
                  title={`${t.label} · ₨ ${money(t.revenue)}`}
                />
                <span className="whitespace-nowrap font-mono text-[10px] text-muted">{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h4 className="mb-2 font-display text-sm font-semibold text-ink">Profit &amp; loss</h4>
      {data.lines.map((l, i) => {
        const isNet = i === data.lines.length - 1;
        // A cost line is a signed contribution, and it can legitimately be positive:
        // a stock write-up credits Stock Adjustment. Printing "₨ 18,500" unsigned
        // under "Cost of goods sold" would read as a cost of 18,500 — the exact
        // opposite of what happened. Components always carry their sign.
        const sign = l.value < 0 ? '− ' : l.indent === 1 ? '+ ' : '';
        return (
          <DataRow
            key={l.label}
            cols="1fr 90px 150px"
            className={cn(isNet && 'border-b-0 border-t-line-strong')}
          >
            <span className={cn(isNet ? 'font-display font-semibold text-ink' : 'text-ink')}>{l.label}</span>
            <span className="text-right font-mono text-muted">{l.pct}</span>
            <span
              className={cn('text-right font-mono font-semibold', l.value < 0 ? 'text-alert' : 'text-ink')}
              title={l.indent === 1 && l.value > 0 ? 'A credit — reduces cost for the period' : undefined}
            >
              {sign}₨ {money(l.value)}
            </span>
          </DataRow>
        );
      })}
      <p className="mt-3 font-mono text-[10px] text-muted">
        Posted from the general ledger. COGS is every account typed Cost of Goods Sold,
        Stock Adjustment or Expenses Included In Valuation; everything else expensed is
        operating cost. A cost line shown with <span className="text-ink">+</span> is a
        credit — a stock receipt booked without a supplier invoice writes inventory up
        and reduces cost for the period.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O-4 · Item performance
// ---------------------------------------------------------------------------

function ItemsTab({ period }: { period: Period }) {
  const { data, isLoading, isError, refetch } = useItemPerformance(period);
  if (isError) return <ErrorState label="item performance" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];
  if (rows.length === 0) return <EmptyState message="Nothing sold in this period." />;

  return (
    <div>
      <DataRow header cols="50px 1fr 140px 90px 130px 120px">
        <span>#</span>
        <span>Item</span>
        <span>Category</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Share</span>
      </DataRow>
      {rows.map((r) => (
        <DataRow key={r.name} cols="50px 1fr 140px 90px 130px 120px">
          <span className="font-mono font-semibold text-saffron">{r.rank}</span>
          <span className="font-medium text-ink">{r.name}</span>
          <span className="text-muted">{r.category || '—'}</span>
          <span className="text-right font-mono">{r.qty}</span>
          <span className="text-right font-mono font-semibold">₨ {money(r.revenue)}</span>
          <span className="flex items-center justify-end gap-2">
            <span className="h-1.5 w-14 overflow-hidden rounded bg-paper-3">
              {/* Share of the listed revenue, so the leader fills the bar. */}
              <span
                className="block h-full bg-saffron"
                style={{ width: `${Math.min(100, (r.sharePct / (rows[0]?.sharePct || 1)) * 100)}%` }}
              />
            </span>
            <span className="font-mono text-muted">{r.sharePct}%</span>
          </span>
        </DataRow>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// O-5 · Multi-branch
// ---------------------------------------------------------------------------

function BranchesTab({ period }: { period: Period }) {
  const { data, isLoading, isError, refetch } = useBranchReport(period);
  if (isError) return <ErrorState label="branch report" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];
  const total = rows.reduce((s, b) => s + b.revenue, 0);

  return (
    <div>
      <div className="mb-5">
        <StatTile
          label="Consolidated revenue"
          value={`₨ ${money(total)}`}
          delta={`${rows.length} ${rows.length === 1 ? 'branch' : 'branches'}`}
          deltaTone={total > 0 ? 'up' : 'muted'}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No companies configured." />
      ) : (
        <>
          <DataRow header cols="1fr 150px 110px 130px 160px">
            <span>Branch</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Orders</span>
            <span className="text-right">Avg ticket</span>
            <span className="text-right">vs previous</span>
          </DataRow>
          {rows.map((b) => (
            <DataRow key={b.branch} cols="1fr 150px 110px 130px 160px">
              <span className="font-medium text-ink">{b.branch}</span>
              <span className="text-right font-mono font-semibold">₨ {money(b.revenue)}</span>
              <span className="text-right font-mono text-muted">{b.orders}</span>
              <span className="text-right font-mono text-muted">₨ {money(b.avgTicket)}</span>
              <span
                className={cn(
                  'text-right font-mono text-[12px]',
                  b.deltaTone === 'up' ? 'text-success' : b.deltaTone === 'down' ? 'text-alert' : 'text-muted',
                )}
              >
                {b.deltaLabel}
              </span>
            </DataRow>
          ))}
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

export default function OwnerReports() {
  const [tab, setTab] = useState('pnl');
  const [period, setPeriod] = useState<Period>('week');

  return (
    <OwnerShell
      greet="Reports & analytics"
      title="Business reports"
      lead="Posted from the general ledger and submitted invoices — P&L, item mix, branch roll-up"
      actions={<PeriodPicker value={period} onChange={setPeriod} />}
      tabs={<Tabs tabs={TABS} active={tab} onChange={setTab} className="mt-6" />}
    >
      {tab === 'pnl' && <PnlTab period={period} />}
      {tab === 'items' && <ItemsTab period={period} />}
      {tab === 'branches' && <BranchesTab period={period} />}
    </OwnerShell>
  );
}

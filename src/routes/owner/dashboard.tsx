import { OwnerShell } from '@/components/layouts/OwnerShell';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { money } from '@/lib/format';
import type { MiniStat } from '@/types/domain';
import { useOwnerDashboard } from '@/hooks/useOwnerDashboard';

const PERIODS = [
  { code: 'P-01', label: 'Day', active: true },
  { code: 'P-02', label: 'Week' },
  { code: 'P-03', label: 'Month' },
  { code: 'P-04', label: 'Quarter' },
  { code: 'P-05', label: 'Custom' },
];

function Tabs() {
  return (
    <div className="mt-6 flex gap-6 overflow-x-auto border-b border-line">
      {PERIODS.map((p) => (
        <div
          key={p.code}
          className={cn(
            '-mb-px cursor-pointer whitespace-nowrap border-b-2 py-2.5 font-display text-[13px] font-medium',
            p.active
              ? 'border-saffron font-semibold text-ink'
              : 'border-transparent text-muted',
          )}
        >
          <span className={cn('mr-1.5 font-mono text-[10px]', p.active ? 'text-saffron' : 'text-muted')}>
            {p.code}
          </span>
          {p.label}
        </div>
      ))}
    </div>
  );
}

function MiniCard({ stat }: { stat: MiniStat }) {
  return (
    <div className="relative rounded-md border border-line bg-paper-2 px-5 py-[18px]">
      <CornerTicks />
      <div className="font-mono text-[10px] uppercase tracking-code text-muted">{stat.label}</div>
      <div className="mt-1.5 font-display text-[28px] font-bold tracking-[-0.02em] text-ink">
        {stat.value}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span
          className={cn('font-mono text-[11px]', stat.deltaTone === 'down' ? 'text-alert' : 'text-success')}
        >
          {stat.delta}
        </span>
        <span className="font-mono text-[10px] tracking-[0.04em] text-muted">{stat.aux}</span>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { data, isLoading } = useOwnerDashboard();

  if (isLoading || !data) {
    return (
      <OwnerShell greet="Loading" title="Dashboard">
        <div className="grid h-64 place-items-center font-mono text-xs uppercase tracking-code text-muted">
          Loading…
        </div>
      </OwnerShell>
    );
  }

  return (
    <OwnerShell
      greet={data.greet}
      title={`Good evening, ${data.ownerName}`}
      lead={data.lead}
      actions={
        <>
          <Button variant="ghost">Download PDF</Button>
          <Button variant="ghost">Send to WhatsApp</Button>
        </>
      }
      tabs={<Tabs />}
    >
      {/* Hero: P&L + mini stats */}
      <div className="mb-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative rounded-lg bg-ink p-6 text-paper">
          <CornerTicks />
          <div className="mb-5 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-code text-muted-2">
              Net profit · today
            </span>
            <span className="font-mono text-[11px] text-saffron">{data.pnl.periodLabel}</span>
          </div>
          <div className="font-display text-[52px] font-bold leading-none tracking-[-0.03em]">
            <span className="mr-1.5 align-[6px] font-mono text-xl font-medium text-muted-2">₨</span>
            {money(data.pnl.netProfit)}
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-success/20 px-2.5 py-1 font-mono text-[11px] text-[#7CC49F]">
            {data.pnl.deltaLabel}
          </div>

          <div className="mt-5 border-t border-ink-3 pt-5">
            {data.pnl.lines.map((line, i) => {
              const isTotal = i === data.pnl.lines.length - 1;
              return (
                <div
                  key={line.label}
                  className={cn(
                    'grid grid-cols-[1fr_90px_60px] items-center gap-3 py-2 text-[13px]',
                    isTotal && 'mt-1.5 border-t border-ink-3 pt-3.5',
                  )}
                >
                  <span className={isTotal ? 'font-display font-semibold text-paper' : 'text-line-2'}>
                    {line.label}
                  </span>
                  <span
                    className={cn(
                      'text-right font-mono',
                      isTotal ? 'text-[15px] font-bold text-saffron' : 'font-medium text-paper',
                    )}
                  >
                    {line.value < 0 ? `−${money(line.value)}` : money(line.value)}
                  </span>
                  <span className="text-right font-mono text-[11px] text-muted-2">{line.pct}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {data.miniStats.map((stat) => (
            <MiniCard key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      {/* Row 2: revenue chart + best dishes */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="relative rounded-md border border-line bg-paper-2 p-5">
          <CornerTicks />
          <div className="mb-2 flex items-baseline justify-between">
            <h4 className="font-display text-[15px] font-semibold text-ink">Revenue by hour</h4>
            <span className="font-mono text-[10px] tracking-ref text-muted">08:00 – 22:00</span>
          </div>
          <div className="relative flex h-[180px] items-end gap-1.5 border-b border-line pb-2 pt-5">
            {data.revenueByHour.map((bar) => (
              <div
                key={bar.hour}
                style={{ height: `${bar.pct}%` }}
                className={cn('flex-1 rounded-t-sm', bar.peak ? 'bg-saffron' : 'bg-teal')}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {data.revenueByHour.map((bar) => (
              <div key={bar.hour} className="flex-1 text-center font-mono text-[10px] text-muted">
                {bar.hour}
              </div>
            ))}
          </div>
          <div className="mt-5">
            <SheetRef tracking="ref">{data.peakNote}</SheetRef>
          </div>
        </div>

        <div className="relative rounded-md border border-line bg-paper-2 p-5">
          <CornerTicks />
          <div className="mb-2 flex items-baseline justify-between">
            <h4 className="font-display text-[15px] font-semibold text-ink">Best dishes today</h4>
            <span className="font-mono text-[10px] tracking-ref text-muted">by revenue · top 6</span>
          </div>
          <div>
            {data.bestDishes.map((dish, i) => (
              <div
                key={dish.rank}
                className={cn(
                  'grid grid-cols-[24px_1fr_60px_80px] items-center gap-3 py-2.5 text-[13px]',
                  i < data.bestDishes.length - 1 && 'border-b border-line',
                )}
              >
                <span className="font-mono font-semibold text-muted">
                  {dish.rank.toString().padStart(2, '0')}
                </span>
                <span className="text-ink">
                  {dish.name}
                  <span className="ml-1.5 font-mono text-[10px] uppercase tracking-ref text-muted">
                    {dish.category}
                  </span>
                </span>
                <span className="text-right font-mono text-xs text-muted">{dish.count}×</span>
                <span className="text-right font-mono font-semibold text-ink">
                  {money(dish.revenue)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <SheetRef tracking="ref">{data.bottomNote}</SheetRef>
          </div>
        </div>
      </div>

      {/* Attention row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative rounded-md border border-alert bg-alert-2 px-5 py-[18px]">
          <CornerTicks />
          <div className="font-mono text-[10px] uppercase tracking-code text-alert">Attention</div>
          <div className="mt-1.5 font-display text-xl font-bold text-alert">3 pending approvals</div>
          <div className="mt-1.5 font-mono text-[10px] text-muted">
            wastage entries awaiting your decision
          </div>
          <div className="mt-3">
            <Button variant="alert" size="sm">
              Review →
            </Button>
          </div>
        </div>
        <div className="relative rounded-md border border-amber bg-amber-2 px-5 py-[18px]">
          <CornerTicks />
          <div className="font-mono text-[10px] uppercase tracking-code text-amber">Restock soon</div>
          <div className="mt-1.5 font-display text-xl font-bold text-amber">6 items low</div>
          <div className="mt-1.5 font-mono text-[10px] text-muted">
            chicken breast · beef mince · matcha · 3 more
          </div>
          <div className="mt-3">
            <Button variant="ghost" size="sm">
              See list →
            </Button>
          </div>
        </div>
        <div className="relative rounded-md border border-line bg-paper-2 px-5 py-[18px]">
          <CornerTicks />
          <div className="font-mono text-[10px] uppercase tracking-code text-muted">Cameras</div>
          <div className="mt-1.5 font-display text-xl font-bold text-ink">4/4 online</div>
          <div className="mt-1.5 font-mono text-[10px] text-muted">14 days retention available</div>
          <div className="mt-3">
            <Button variant="ghost" size="sm">
              Open live view →
            </Button>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

import { OwnerShell } from '@/components/layouts/OwnerShell';
import { Chip } from '@/components/naqsha/Chip';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { money } from '@/lib/format';
import type { Wastage, WastageItem } from '@/types/domain';
import { useApprovalCounts, usePendingApprovals, useWeekSummary } from '@/hooks/useWastage';

function itemsSummary(items: WastageItem[]): string {
  return items
    .map((it) => {
      const mass = ['kg', 'g', 'l', 'ml'].includes(it.uom);
      return mass ? `${it.qty} ${it.uom} ${it.name.toLowerCase()}` : `${it.qty}× ${it.name.toLowerCase()}`;
    })
    .join(' · ');
}

function ApprovalCard({ entry }: { entry: Wastage }) {
  return (
    <div className="relative grid gap-6 rounded-md border border-line bg-paper-2 px-6 py-5 lg:grid-cols-[100px_1fr_240px_180px] lg:items-center">
      <CornerTicks />
      <div>
        <div className="font-mono text-[11px] tracking-[0.04em] text-muted">{entry.ref}</div>
        <div className="mt-1 font-display text-[22px] font-bold tracking-[-0.01em] text-alert">
          <span className="font-mono text-[11px] text-muted">₨</span>
          {money(entry.totalValue)}
        </div>
        <div className="font-mono text-[11px] text-muted">value at cost</div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2.5">
          <h5 className="font-display text-sm font-semibold text-ink">{entry.reasonLabel}</h5>
          {entry.tag && <Chip variant={entry.tag.tone}>{entry.tag.label}</Chip>}
        </div>
        <div className="text-[12.5px] text-muted">{entry.note}</div>
        <div className="mt-2 font-mono text-[11px] text-ink">{itemsSummary(entry.items)}</div>
      </div>

      <div>
        {[
          { k: 'Manager', v: entry.managerLabel, tone: 'text-ink' },
          { k: 'Reported', v: entry.reportedAtLabel, tone: 'text-ink' },
          {
            k: 'Evidence',
            v: entry.evidenceCount > 0 ? `${entry.evidenceCount} photo attached` : 'none',
            tone: entry.evidenceCount > 0 ? 'text-teal' : 'text-muted',
          },
        ].map((row) => (
          <div key={row.k} className="mb-1.5 flex gap-2 text-xs">
            <span className="w-[70px] font-mono text-[10px] uppercase tracking-ref text-muted">
              {row.k}
            </span>
            <span className={row.tone}>{row.v}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="primary">Approve</Button>
        <Button variant="ghost">Reject</Button>
        <button
          type="button"
          className="rounded py-1 text-center font-body text-xs font-medium text-muted hover:text-ink"
        >
          Ask for more info
        </button>
      </div>
    </div>
  );
}

export default function OwnerWastageApprovals() {
  const { data: approvals, isLoading } = usePendingApprovals();
  const { data: counts } = useApprovalCounts();
  const { data: week } = useWeekSummary();

  const tabs = [
    { code: 'Q-01', label: `Pending · ${counts?.pending ?? 0}`, active: true },
    { code: 'Q-02', label: `Approved · ${counts?.approved ?? 0}` },
    { code: 'Q-03', label: `Rejected · ${counts?.rejected ?? 0}` },
    { code: 'Q-04', label: 'All' },
  ];

  return (
    <OwnerShell
      greet="Wastage / approvals"
      title="Pending approvals"
      lead={`${counts?.pending ?? 3} entries awaiting your decision · older than 24 hours auto-expire (manager will need to resubmit)`}
      actions={<Button variant="ghost">Rules &amp; policy</Button>}
      tabs={
        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-line">
          {tabs.map((t) => (
            <div
              key={t.code}
              className={cn(
                '-mb-px cursor-pointer whitespace-nowrap border-b-2 py-2.5 font-display text-[13px] font-medium',
                t.active ? 'border-saffron font-semibold text-ink' : 'border-transparent text-muted',
              )}
            >
              <span className={cn('mr-1.5 font-mono text-[10px]', t.active ? 'text-saffron' : 'text-muted')}>
                {t.code}
              </span>
              {t.label}
            </div>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[150px] animate-pulse rounded-md bg-paper-3" />
          ))}
        </div>
      ) : (approvals ?? []).length === 0 ? (
        <div className="grid h-40 place-items-center rounded-md border border-dashed border-line-strong text-sm text-muted">
          Nothing pending — you&apos;re all caught up.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(approvals ?? []).map((entry) => (
            <ApprovalCard key={entry.ref} entry={entry} />
          ))}
        </div>
      )}

      {week && (
        <div className="mt-8 rounded-md border border-dashed border-line-strong bg-paper-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold text-ink">Wastage this week</div>
              <div className="mt-1 font-mono text-[11px] tracking-[0.04em] text-muted">
                {week.rangeLabel}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] uppercase tracking-ref text-muted">
                Approved · pending
              </div>
              <div className="font-display text-xl font-bold tracking-[-0.01em] text-ink">
                <span className="font-mono text-xs font-medium text-muted">₨</span>{' '}
                {money(week.approvedValue)} ·{' '}
                <span className="text-alert">₨ {money(week.pendingValue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}

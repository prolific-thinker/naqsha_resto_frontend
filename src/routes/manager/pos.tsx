import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { DataRow } from '@/components/naqsha/DataRow';
import { Button } from '@/components/ui/Button';
import { BillLine } from '@/components/bill/BillLine';
import { BatchMarker } from '@/components/bill/BatchMarker';
import { SplitStepper } from '@/components/bill/SplitStepper';
import { cn } from '@/lib/utils';
import { money } from '@/lib/format';
import type { MopKind } from '@/types/domain';
import { useInvoice } from '@/hooks/useInvoice';

const MOPS: { kind: MopKind; name: string; desc: string }[] = [
  { kind: 'cash', name: 'Cash', desc: 'Naqad' },
  { kind: 'card', name: 'Card', desc: 'Visa/MC' },
  { kind: 'wallet', name: 'Wallet', desc: 'JazzCash' },
];

export default function ManagerPos() {
  const { tableId = 'T-07' } = useParams();
  const { data: inv, isLoading } = useInvoice(tableId);
  const [split, setSplit] = useState(4);
  const [mop, setMop] = useState<MopKind>('cash');

  if (isLoading || !inv) {
    return (
      <ManagerShell title="Bill preview" refCode="loading…">
        <div className="grid flex-1 place-items-center font-mono text-xs uppercase tracking-code text-muted">
          Loading bill…
        </div>
      </ManagerShell>
    );
  }

  const perPerson = Math.round(inv.grandTotal / split);
  const avgPerPax = Math.round(inv.grandTotal / inv.pax);

  return (
    <ManagerShell
      title="Bill preview"
      refCode={`${inv.ref} · draft`}
      right={
        <>
          <span className="font-mono text-[11px] text-muted">
            Waiter · <strong className="text-ink">{inv.waiter.name} {inv.waiter.id}</strong>
          </span>
          <span className="font-mono text-[11px] text-muted">
            Duration · <strong className="text-ink">{inv.durationLabel}</strong>
          </span>
          <Button variant="ghost" size="sm">
            Print preview
          </Button>
        </>
      }
    >
      <div className="grid flex-1 grid-cols-[1.4fr_1fr] overflow-hidden">
        {/* Bill preview */}
        <div className="overflow-y-auto bg-paper px-6 py-5">
          <div className="mb-5 flex items-start justify-between border-b border-line pb-5">
            <div>
              <h3 className="font-display text-[28px] font-bold tracking-[-0.02em] text-ink">
                Table {inv.tableNumber}
                <span className="ml-2 font-mono text-sm font-medium text-muted">· {inv.pax} pax</span>
              </h3>
              <div className="mt-1 font-mono text-xs tracking-[0.03em] text-muted">
                <span>Opened {inv.openedAtLabel}</span>
                <span className="mx-2 text-line-strong">·</span>
                <span>{inv.waiter.name} {inv.waiter.id}</span>
                <span className="mx-2 text-line-strong">·</span>
                <span>{inv.batches.length} order batches</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">+ Discount</Button>
              <Button variant="ghost" size="sm">+ Note</Button>
            </div>
          </div>

          <DataRow header cols="40px 1fr 60px 100px">
            <span>Qty</span>
            <span>Item</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </DataRow>

          {inv.batches.map((batch, bi) => (
            <div key={bi}>
              {batch.label && <BatchMarker label={batch.label} />}
              {batch.lines.map((line, li) => (
                <BillLine key={`${bi}-${li}`} line={line} />
              ))}
            </div>
          ))}

          <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line-strong py-3 pt-4">
            <span />
            <span className="font-display text-sm font-semibold text-ink">
              Subtotal · {inv.subtotalItems} items
            </span>
            <span />
            <span className="text-right font-mono text-[13px] font-semibold text-ink">
              {money(inv.subtotal)}
            </span>
          </div>
          <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line py-3">
            <span />
            <span className="text-[13px] text-muted">Service charge ({inv.serviceChargePct}%)</span>
            <span />
            <span className="text-right font-mono text-[13px] text-muted">—</span>
          </div>
          {inv.discount !== undefined && (
            <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line py-3">
              <span />
              <span className="text-[13px] text-alert">{inv.discountLabel}</span>
              <span />
              <span className="text-right font-mono text-[13px] text-alert">
                −{money(inv.discount)}
              </span>
            </div>
          )}
        </div>

        {/* Total / split / MOP */}
        <aside className="flex flex-col gap-4 overflow-y-auto border-l border-line bg-paper-2 p-6">
          <div className="relative rounded-md bg-ink p-5 text-paper">
            <CornerTicks />
            <div className="font-mono text-[10px] uppercase tracking-code text-muted-2">
              Grand total
            </div>
            <div className="mt-2 font-display text-[40px] font-bold tracking-[-0.02em]">
              <span className="mr-1.5 align-[6px] font-mono text-xl font-medium text-muted-2">₨</span>
              {money(inv.grandTotal)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-saffron">
              {inv.pax} pax · avg ₨ {money(avgPerPax)} per person
            </div>
          </div>

          <div className="relative rounded-md border border-line bg-paper p-[18px]">
            <CornerTicks />
            <h4 className="mb-3 font-display text-sm font-semibold text-ink">Split bill</h4>
            <div className="my-3 flex items-center gap-3 rounded-sm bg-paper-3 p-3">
              <span className="flex-1 text-xs text-muted">Split evenly across</span>
              <SplitStepper value={split} onChange={setSplit} />
              <span className="text-xs text-muted">people</span>
            </div>
            <div className="mt-2.5 rounded-sm border border-dashed border-saffron bg-[#F4EFE0] p-3 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                Per-person share
              </div>
              <div className="mt-1 font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
                ₨ {money(perPerson)}
              </div>
            </div>
            <div className="mt-3 flex justify-between font-mono text-[11px] text-muted">
              <span>Printed on bill</span>
              <span>{split} lines below total</span>
            </div>
          </div>

          <div className="relative rounded-md border border-line bg-paper p-[18px]">
            <CornerTicks />
            <h4 className="mb-3 font-display text-sm font-semibold text-ink">Mode of payment</h4>
            <div className="grid grid-cols-3 gap-2">
              {MOPS.map((m) => (
                <button
                  key={m.kind}
                  type="button"
                  aria-pressed={mop === m.kind}
                  onClick={() => setMop(m.kind)}
                  className={cn(
                    'rounded border px-2 py-3 text-center',
                    mop === m.kind
                      ? 'border-teal bg-teal-3 text-teal'
                      : 'border-line bg-paper-2',
                  )}
                >
                  <div className="font-display text-xs font-semibold">{m.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">{m.desc}</div>
                </button>
              ))}
            </div>
            <Button variant="primary" size="lg" className="mt-3.5 w-full">
              Take payment · print bill
            </Button>
          </div>
        </aside>
      </div>
    </ManagerShell>
  );
}

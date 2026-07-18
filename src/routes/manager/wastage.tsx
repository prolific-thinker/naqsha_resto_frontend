import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { cost, pkr } from '@/lib/format';
import type { WastageItem, WastageReason } from '@/types/domain';
import { WASTAGE_DRAFT } from '@/lib/mocks/wastage';

const REASONS: { value: WastageReason; label: string }[] = [
  { value: 'spillage', label: 'Spillage' },
  { value: 'refused', label: 'Customer refused' },
  { value: 'cook_error', label: 'Cook error' },
  { value: 'expired', label: 'Expired ingredient' },
  { value: 'other', label: 'Other' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative mb-4 rounded-md border border-line bg-paper-2 p-5">
      <CornerTicks />
      <h4 className="mb-3 font-mono text-[10px] uppercase tracking-code text-muted">{title}</h4>
      {children}
    </div>
  );
}

export default function ManagerWastage() {
  const [reason, setReason] = useState<WastageReason>(WASTAGE_DRAFT.reason);
  const [note, setNote] = useState(WASTAGE_DRAFT.note);
  const [items, setItems] = useState<WastageItem[]>(WASTAGE_DRAFT.items);

  const total = items.reduce((sum, it) => sum + it.amount, 0);

  function removeItem(code: string) {
    setItems((prev) => prev.filter((it) => it.code !== code));
  }

  return (
    <ManagerShell
      title="Wastage"
      refCode="M-04 · Draft WST-C-2026-0018"
      right={
        <>
          <span className="font-mono text-[11px] text-muted">
            Today&apos;s wastage · <strong className="text-ink">₨ 1,240</strong> (2 approved)
          </span>
          <span className="font-mono text-[11px] text-muted">
            Pending · <strong className="text-ink">1</strong>
          </span>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto bg-paper px-8 py-6">
        <div className="max-w-[900px]">
          <div className="mb-1 font-mono text-[11px] tracking-ref text-muted">
            Wastage / New entry
          </div>
          <h3 className="mb-1.5 font-display text-[26px] font-bold tracking-[-0.02em] text-ink">
            Record wastage
          </h3>
          <p className="mb-6 max-w-[560px] text-[13px] text-muted">
            Enter what was spilled, wasted, or refused. Owner will receive this by email + WhatsApp
            for approval.
          </p>

          <Section title="Reason">
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={reason === r.value}
                  onClick={() => setReason(r.value)}
                  className={cn(
                    'rounded border px-3.5 py-2 text-xs font-medium',
                    reason === r.value
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line-strong bg-paper text-muted',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Notes for owner (optional)
              </label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </div>
          </Section>

          <Section title="Items wasted">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Item', 'Qty', 'UOM'].map((h) => (
                    <th
                      key={h}
                      className="border-b border-line-strong px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="border-b border-line-strong px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    Rate
                  </th>
                  <th className="border-b border-line-strong px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    Amount
                  </th>
                  <th className="border-b border-line-strong" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.code}>
                    <td className="border-b border-line px-3 py-2.5 text-[13px]">
                      {it.name}
                      <span className="ml-1.5 font-mono text-[10px] text-muted">{it.code}</span>
                    </td>
                    <td className="border-b border-line px-3 py-2.5 font-mono text-[13px]">{it.qty}</td>
                    <td className="border-b border-line px-3 py-2.5 font-mono text-[13px]">{it.uom}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right font-mono text-[13px]">
                      {cost(it.rate)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right font-mono text-[13px]">
                      {cost(it.amount)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right">
                      <button
                        type="button"
                        aria-label={`Remove ${it.name}`}
                        onClick={() => removeItem(it.code)}
                        className="text-muted hover:text-alert"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} className="pt-3.5 text-right font-display text-[13px] font-bold">
                    Total wastage value
                  </td>
                  <td className="pt-3.5 text-right font-mono text-[15px] font-bold text-alert">
                    {pkr(total)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
            <div className="mt-3">
              <Button variant="ghost" size="sm">
                + Add item
              </Button>
            </div>
            <div className="mt-2">
              <SheetRef tracking="ref">
                Rate auto-filled from item avg cost · not selling price
              </SheetRef>
            </div>
          </Section>

          <Section title="Evidence (optional)">
            <div className="rounded border-2 border-dashed border-line-strong bg-paper p-6 text-center">
              <div className="mb-2 inline-grid h-[42px] w-[42px] place-items-center rounded-full bg-paper-3 text-muted">
                <Upload size={20} />
              </div>
              <div className="text-[13px] font-medium text-ink">Take photo or upload</div>
              <div className="mt-1 text-[11px] text-muted">
                JPG/PNG · max 2 MB · owner sees this in the approval email
              </div>
            </div>
          </Section>

          <div className="mt-5 flex items-center justify-end gap-3">
            <div className="mr-auto font-mono text-[11px] text-muted">
              → On submit: WST-C-2026-0018 emailed to owner. Stock deduction happens on approval.
            </div>
            <Button variant="ghost">Save draft</Button>
            <Button variant="saffron">Send for approval →</Button>
          </div>
        </div>
      </div>
    </ManagerShell>
  );
}

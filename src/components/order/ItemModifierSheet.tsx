import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/types/domain';

/**
 * FOH-2 (modifiers / variations) + FOH-3 (course & seat) capture. The chosen
 * options are returned as a single structured note string that rides on the
 * cart line (and downstream onto the KOT Item). In production these map to
 * Item Variant / Item Attribute + custom KOT Item fields (course, seat).
 */

type Group = { key: string; label: string; options: string[]; multi?: boolean };

const MODIFIERS: Group[] = [
  { key: 'size', label: 'Size', options: ['Regular', 'Large'] },
  { key: 'spice', label: 'Spice', options: ['Mild', 'Medium', 'Hot'] },
  { key: 'addons', label: 'Add-ons', options: ['Extra cheese', 'Extra sauce', 'No onion'], multi: true },
];
const COURSES = ['Starter', 'Main', 'Dessert'];
const SEATS = [1, 2, 3, 4, 5, 6];

function buildNote(sel: Record<string, string[]>, course?: string, seat?: number): string {
  const parts: string[] = [];
  for (const g of MODIFIERS) {
    const v = sel[g.key];
    if (v && v.length) parts.push(v.join(' + '));
  }
  if (course) parts.push(`course: ${course}`);
  if (seat) parts.push(`seat ${seat}`);
  return parts.join(' · ');
}

type Props = {
  item: MenuItem;
  onCancel: () => void;
  onConfirm: (note: string) => void;
};

export function ItemModifierSheet({ item, onCancel, onConfirm }: Props) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [course, setCourse] = useState<string | undefined>();
  const [seat, setSeat] = useState<number | undefined>();

  const toggle = (g: Group, opt: string) =>
    setSel((s) => {
      const cur = s[g.key] ?? [];
      if (g.multi) {
        return { ...s, [g.key]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
      }
      return { ...s, [g.key]: cur[0] === opt ? [] : [opt] };
    });

  const isOn = (g: Group, opt: string) => (sel[g.key] ?? []).includes(opt);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-line bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-ref text-muted">Customize</div>
            <h3 className="font-display text-base font-semibold text-ink">{item.name}</h3>
          </div>
          <button onClick={onCancel} aria-label="close" className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {MODIFIERS.map((g) => (
            <div key={g.key} className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-display text-[13px] font-semibold text-ink">{g.label}</span>
                {g.multi && <span className="font-mono text-[10px] text-muted">choose any</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.options.map((opt) => (
                  <Pill key={opt} label={opt} on={isOn(g, opt)} onClick={() => toggle(g, opt)} />
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4">
            <div className="mb-2 font-display text-[13px] font-semibold text-ink">Course <span className="font-mono text-[10px] text-muted">(FOH-3)</span></div>
            <div className="flex flex-wrap gap-2">
              {COURSES.map((c) => (
                <Pill key={c} label={c} on={course === c} onClick={() => setCourse((v) => (v === c ? undefined : c))} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-display text-[13px] font-semibold text-ink">Seat <span className="font-mono text-[10px] text-muted">(FOH-3)</span></div>
            <div className="flex flex-wrap gap-2">
              {SEATS.map((s) => (
                <Pill key={s} label={`Seat ${s}`} on={seat === s} onClick={() => setSeat((v) => (v === s ? undefined : s))} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <span className="font-mono text-sm font-semibold text-ink">₨ {money(item.price)}</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" onClick={() => onConfirm(buildNote(sel, course, seat))}>Add to order</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 font-body text-[13px] font-medium',
        on ? 'border-teal bg-teal text-paper' : 'border-line-strong text-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

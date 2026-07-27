import { useState } from 'react';
import { Check, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/format';
import { Chip } from '@/components/naqsha/Chip';
import { prepFor } from '@/lib/mocks/recipes';
import { elapsedSecondsSince, useNow } from '@/hooks/useNow';
import { KotTimer } from './KotTimer';
import type { Kot, Station } from '@/types/domain';

type Accent = { borderL: string; timer: string; action: string };

/** Station-themed accents for the active state (palette-swap by :station). */
// Station is free-form (the cafe can add one), so this lookup can miss —
// STATION_FALLBACK keeps an unknown station rendering instead of crashing.
const STATION_ACCENT: Record<Station, Accent> = {
  drinks: { borderL: 'border-l-saffron', timer: 'text-saffron', action: 'bg-saffron/15 text-saffron' },
  main: { borderL: 'border-l-amber', timer: 'text-amber', action: 'bg-amber/15 text-amber' },
  bbq: { borderL: 'border-l-alert', timer: 'text-alert', action: 'bg-alert/15 text-alert' },
};

const STATION_FALLBACK: Accent = {
  borderL: 'border-l-line-2',
  timer: 'text-line-1',
  action: 'bg-line-2/15 text-line-1',
};

type Props = {
  kot: Kot;
  onAdvance?: () => void;
  className?: string;
};

export function KotCard({ kot, onAdvance, className }: Props) {
  const accent = STATION_ACCENT[kot.station] ?? STATION_FALLBACK;
  const isActive = kot.state === 'preparing' || kot.state === 'breach';
  const isBreach = kot.state === 'breach';
  const isPrepared = kot.state === 'prepared';

  const now = useNow();
  const queuedWait = kot.receivedAt ? elapsedSecondsSince(kot.receivedAt, now) : kot.waitSeconds ?? 0;

  const [showPrep, setShowPrep] = useState(false);
  // KDS-1 · prep steps for the items on this ticket (from ERPNext BOM in prod).
  const prep = kot.items
    .map((it) => ({ name: it.name, steps: prepFor(it.name) }))
    .filter((p) => p.steps.length > 0);

  return (
    <div
      className={cn(
        'rounded border border-ink-3 bg-ink-2 p-3',
        isActive && 'border-l-[3px]',
        isActive && !isBreach && accent.borderL,
        isBreach && 'border-l-alert',
        isPrepared && 'border-l-[3px] border-l-success opacity-90',
        className,
      )}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-ref text-saffron">{kot.ref}</span>
        {kot.state === 'queued' && (
          <span className="font-mono text-[11px] text-line-2">{duration(queuedWait)} wait</span>
        )}
        {kot.state === 'preparing' && <Chip variant="amber">preparing</Chip>}
        {isBreach && <Chip variant="alert">SLA breach</Chip>}
        {isPrepared && <Chip variant="success">ready</Chip>}
      </div>

      <div className="font-display text-base font-bold text-paper">{kot.tableRef}</div>

      <div className="mt-1">
        {kot.items.map((item, i) => (
          <div key={i} className="flex justify-between py-0.5 text-[13px]">
            <span className="text-paper-4">
              {item.name}
              {item.comment && (
                <span className="block text-[10px] italic text-saffron">{item.comment}</span>
              )}
            </span>
            <span className="font-mono text-saffron">×{item.qty}</span>
          </div>
        ))}
      </div>

      {prep.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPrep((s) => !s)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-ref text-line-2 hover:text-paper"
            aria-expanded={showPrep}
          >
            <ChefHat size={12} /> {showPrep ? 'hide' : 'recipe'} card
          </button>
          {showPrep && (
            <div className="mt-1.5 space-y-2 rounded-sm bg-ink-3/60 p-2.5">
              {prep.map((p) => (
                <div key={p.name}>
                  <div className="font-display text-[11px] font-semibold text-paper-4">{p.name}</div>
                  <ol className="mt-1 space-y-0.5">
                    {p.steps.map((s, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] text-line-2">
                        <span className="font-mono text-saffron">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(isActive || isPrepared) && <KotTimer kot={kot} accentText={accent.timer} />}

      {/* A queued ticket needs a way into preparing, or started_at is never stamped
          and the SLA clock has nothing to run from. */}
      {kot.state === 'queued' && (
        <button
          type="button"
          onClick={onAdvance}
          className={cn(
            'mt-2.5 w-full rounded-sm py-2 text-center font-display text-xs font-semibold',
            accent.action,
          )}
        >
          Start cooking →
        </button>
      )}
      {isActive && (
        <button
          type="button"
          onClick={onAdvance}
          className={cn(
            'mt-2.5 w-full rounded-sm py-2 text-center font-display text-xs font-semibold',
            accent.action,
          )}
        >
          Mark prepared →
        </button>
      )}
      {isPrepared && (
        <div className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-sm bg-success/15 py-2 font-display text-xs font-semibold text-[#7CC49F]">
          Collected <Check size={13} />
        </div>
      )}
    </div>
  );
}

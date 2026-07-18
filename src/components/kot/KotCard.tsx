import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/format';
import { Chip } from '@/components/naqsha/Chip';
import { KotTimer } from './KotTimer';
import type { Kot, Station } from '@/types/domain';

type Accent = { borderL: string; timer: string; action: string };

/** Station-themed accents for the active state (palette-swap by :station). */
export const STATION_ACCENT: Record<Station, Accent> = {
  drinks: { borderL: 'border-l-saffron', timer: 'text-saffron', action: 'bg-saffron/15 text-saffron' },
  main: { borderL: 'border-l-amber', timer: 'text-amber', action: 'bg-amber/15 text-amber' },
  bbq: { borderL: 'border-l-alert', timer: 'text-alert', action: 'bg-alert/15 text-alert' },
};

type Props = {
  kot: Kot;
  onAdvance?: () => void;
  className?: string;
};

export function KotCard({ kot, onAdvance, className }: Props) {
  const accent = STATION_ACCENT[kot.station];
  const isActive = kot.state === 'preparing' || kot.state === 'breach';
  const isBreach = kot.state === 'breach';
  const isPrepared = kot.state === 'prepared';

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
          <span className="font-mono text-[11px] text-line-2">{duration(kot.waitSeconds ?? 0)} wait</span>
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

      {(isActive || isPrepared) && <KotTimer kot={kot} accentText={accent.timer} />}

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

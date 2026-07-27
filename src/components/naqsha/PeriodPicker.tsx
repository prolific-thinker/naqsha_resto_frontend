import type { Period } from '@/hooks/useErp';
import { cn } from '@/lib/utils';

const OPTIONS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: 'Month' },
];

type Props = { value: Period; onChange: (p: Period) => void; className?: string };

/**
 * The period selector for every period-scoped ERP screen.
 *
 * A single shared control because the three periods mean exactly the same thing on
 * each of them — the server derives all three windows from one `resolve_period`, so a
 * screen inventing its own "last 30 days" would silently disagree with the P&L.
 */
export function PeriodPicker({ value, onChange, className }: Props) {
  return (
    <div className={cn('inline-flex rounded border border-line-strong bg-paper p-0.5', className)} role="group">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          aria-pressed={value === opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            'rounded px-3 py-1 font-mono text-[11px] uppercase tracking-ref transition-colors',
            value === opt.key ? 'bg-teal text-paper' : 'text-muted hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

import { cn } from '@/lib/utils';
import { Chip } from '@/components/naqsha/Chip';
import { pkr } from '@/lib/format';
import type { KotProgress, Table, TableState } from '@/types/domain';

type Props = {
  table: Table;
  variant: 'waiter' | 'manager';
  onClick?: () => void;
  className?: string;
};

// Background + border per table state, covering both mockups (A-01 waiter,
// M-01 manager). Tint borders are card-specific values from the mockup.
const STATE_STYLES: Record<TableState, string> = {
  free: 'bg-paper-2 border-line',
  mine: 'border-teal bg-[#F1F7F7]',
  occupied: 'bg-paper-3 border-line-strong',
  active: 'bg-teal-3 border-[#B8D4D8]',
  breach: 'bg-[#FDF0EE] border-[#E5B4AE]',
  ready: 'bg-success-2 border-[#B0D4C0]',
  feedback: 'bg-[#FFF8E5] border-[#E9C79B]',
  billing: 'bg-teal-3 border-[#B8D4D8]',
};

const PROGRESS_STYLE: Record<KotProgress, string> = {
  pending: 'bg-line',
  prep: 'bg-saffron',
  done: 'bg-success',
};

const ACTION_TONE: Partial<Record<TableState, string>> = {
  ready: 'text-success',
  breach: 'text-alert',
  feedback: 'text-amber',
};

export function TableCard({ table, variant, onClick, className }: Props) {
  const isFree = table.state === 'free';
  const numTone = isFree ? 'text-muted-2' : 'text-ink';
  const refTone = table.state === 'mine' ? 'text-teal' : 'text-muted';

  if (variant === 'waiter') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative min-h-[96px] rounded-md border p-4 text-left',
          STATE_STYLES[table.state],
          className,
        )}
      >
        {table.statusTag && (
          <span className="absolute right-3 top-3">
            <Chip variant={table.statusTag.tone}>{table.statusTag.label}</Chip>
          </span>
        )}
        <div className={cn('font-mono text-[10px] tracking-ref', refTone)}>{table.ref}</div>
        <div className={cn('mt-0.5 font-display text-[26px] font-bold tracking-[-0.02em]', numTone)}>
          {table.number}
        </div>
        {table.meta && <div className="mt-1.5 text-[11px] text-muted">{table.meta}</div>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative min-h-[130px] rounded-md border p-4 text-left',
        STATE_STYLES[table.state],
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-ref text-muted">{table.ref}</span>
        {table.statusTag && <Chip variant={table.statusTag.tone}>{table.statusTag.label}</Chip>}
      </div>
      <div className={cn('font-display text-[22px] font-bold', numTone)}>{table.number}</div>

      {isFree ? (
        <div className="mt-5 text-center text-xs text-muted">available</div>
      ) : (
        <>
          {table.meta && <div className="mt-2 font-mono text-[11px] text-ink">{table.meta}</div>}
          {table.kots && (
            <div className="mt-2 flex gap-1">
              {table.kots.map((k, i) => (
                <div key={i} className={cn('h-1 flex-1 rounded-sm', PROGRESS_STYLE[k])} />
              ))}
            </div>
          )}
          {table.amount !== undefined && (
            <div className="mt-1.5 font-mono text-[13px] font-semibold text-ink">
              {pkr(table.amount)}
            </div>
          )}
          {table.actionTag && (
            <div
              className={cn(
                'mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]',
                ACTION_TONE[table.state] ?? 'text-ink',
              )}
            >
              {table.actionTag}
            </div>
          )}
        </>
      )}
    </button>
  );
}

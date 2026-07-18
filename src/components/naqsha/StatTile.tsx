import { cn } from '@/lib/utils';
import { CornerTicks } from './CornerTicks';

type DeltaTone = 'up' | 'down' | 'muted';

type Props = {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: DeltaTone;
  ticks?: boolean;
  className?: string;
};

const DELTA_TONE: Record<DeltaTone, string> = {
  up: 'text-success',
  down: 'text-alert',
  muted: 'text-muted',
};

/**
 * Stat tile — label / big display value / delta line. Used across manager and
 * owner surfaces (mockup `.stat-tile`, `.mini-card`).
 */
export function StatTile({ label, value, delta, deltaTone = 'muted', ticks = true, className }: Props) {
  return (
    <div
      className={cn(
        'relative rounded-md border border-line bg-paper-2 px-4 py-[14px]',
        className,
      )}
    >
      {ticks && <CornerTicks />}
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-ink">{value}</div>
      {delta !== undefined && (
        <div className={cn('mt-0.5 font-mono text-[11px]', DELTA_TONE[deltaTone])}>{delta}</div>
      )}
    </div>
  );
}

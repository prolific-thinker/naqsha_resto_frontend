import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/format';
import type { Kot } from '@/types/domain';

type Props = {
  kot: Kot;
  /** Accent text class for the on-time preparing timer (station-themed). */
  accentText: string;
};

/**
 * Timer row for an active or prepared KOT (mockup `.kot-card .timer`). Counts
 * the elapsed time against SLA; flips to alert styling on breach.
 */
export function KotTimer({ kot, accentText }: Props) {
  if (kot.state === 'prepared') {
    return (
      <div className="mt-2 flex items-center justify-between font-mono text-sm font-semibold text-[#7CC49F]">
        <span>done in {duration(kot.doneSeconds ?? 0)}</span>
        <span className="text-[10px] uppercase tracking-code text-line-2">
          {kot.onTime ? 'on time' : 'late'}
        </span>
      </div>
    );
  }

  const elapsed = kot.elapsedSeconds ?? 0;
  const over = elapsed - kot.slaSeconds;
  const isBreach = kot.state === 'breach' || over > 0;

  return (
    <div
      className={cn(
        'mt-2 flex items-center justify-between font-mono text-sm font-semibold',
        isBreach ? 'text-[#FF9C93]' : accentText,
      )}
    >
      <span className="flex items-center gap-1.5">
        <Timer size={14} />
        {duration(elapsed)}
      </span>
      {isBreach ? (
        <span className="text-[10px] uppercase tracking-code text-[#FF9C93]">
          +{duration(over)} over
        </span>
      ) : (
        <span className="text-[10px] uppercase tracking-code text-line-2">
          SLA {duration(kot.slaSeconds)}
        </span>
      )}
    </div>
  );
}

import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/format';
import { elapsedSecondsSince, useNow } from '@/hooks/useNow';
import type { Kot } from '@/types/domain';

type Props = {
  kot: Kot;
  /** Accent text class for the on-time preparing timer (station-themed). */
  accentText: string;
};

/**
 * Live timer row for an active KOT. Counts real elapsed time up from the
 * ticket's `receivedAt` timestamp (ticking every second), compares it to the
 * SLA, and flips to alert styling on breach. A prepared ticket shows its final
 * prep duration — a finished value, not a running clock.
 */
export function KotTimer({ kot, accentText }: Props) {
  const now = useNow();

  if (kot.state === 'prepared') {
    return (
      <div className="mt-2 flex items-center justify-between font-mono text-sm font-semibold text-[#5EA981]">
        <span>done in {duration(kot.doneSeconds ?? 0)}</span>
        <span className="text-[10px] uppercase tracking-code text-line-2">
          {kot.onTime ? 'on time' : 'late'}
        </span>
      </div>
    );
  }

  // Prefer the real timestamp; fall back to the static seed if absent.
  const elapsed = kot.receivedAt
    ? elapsedSecondsSince(kot.receivedAt, now)
    : kot.elapsedSeconds ?? 0;
  const over = elapsed - kot.slaSeconds;
  const isBreach = over > 0;

  return (
    <div
      className={cn(
        'mt-2 flex items-center justify-between font-mono text-sm font-semibold',
        isBreach ? 'text-[#E08579]' : accentText,
      )}
    >
      <span className="flex items-center gap-1.5">
        <Timer size={14} />
        {duration(elapsed)}
      </span>
      {isBreach ? (
        <span className="text-[10px] uppercase tracking-code text-[#E08579]">
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

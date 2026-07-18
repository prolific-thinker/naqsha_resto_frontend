import { cn } from '@/lib/utils';
import { money } from '@/lib/format';
import type { BillLine as BillLineType, Station } from '@/types/domain';

const STATION_LABEL: Record<Station, string> = { drinks: 'DRINKS', main: 'MAIN', bbq: 'BBQ' };

/** A single bill row (mockup `.bill-line`). */
export function BillLine({ line, className }: { line: BillLineType; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line py-3',
        className,
      )}
    >
      <span className="font-mono font-semibold text-ink">{line.qty}×</span>
      <span className="text-[13.5px] font-medium text-ink">
        {line.name}
        <span className="ml-2 font-mono text-[10px] uppercase tracking-ref text-muted">
          → {STATION_LABEL[line.station]}
        </span>
      </span>
      <span className="text-right font-mono text-xs text-muted">{money(line.rate)}</span>
      <span className="text-right font-mono text-[13px] font-semibold text-ink">
        {money(line.amount)}
      </span>
    </div>
  );
}

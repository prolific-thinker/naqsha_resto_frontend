import { useState } from 'react';
import { seqColor } from './theme';

type Props = {
  rows: string[]; // e.g. ['Mon',…,'Sun']
  cols: string[]; // e.g. hour labels
  values: number[][]; // rows × cols
  format?: (n: number) => string;
  unit?: string;
};

/**
 * Day × hour intensity grid (a sequential single-hue ramp = magnitude). Answers
 * "when are we busy". Per-cell hover tooltip; legend is the ramp itself.
 */
export function Heatmap({ rows, cols, values, format = (n) => String(n), unit = '' }: Props) {
  const [hi, setHi] = useState<{ r: number; c: number } | null>(null);
  const max = Math.max(1, ...values.flat());

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* column labels */}
          <div className="flex pl-10">
            {cols.map((c, ci) => (
              <div key={ci} className="flex-1 text-center font-mono text-[9px] text-muted" style={{ minWidth: 18 }}>
                {ci % 2 === 0 ? c : ''}
              </div>
            ))}
          </div>
          {rows.map((r, ri) => (
            <div key={ri} className="flex items-center">
              <div className="w-10 pr-2 text-right text-[11px] text-muted">{r}</div>
              <div className="flex flex-1 gap-[2px]">
                {cols.map((_, ci) => {
                  const v = values[ri]?.[ci] ?? 0;
                  const on = hi?.r === ri && hi?.c === ci;
                  return (
                    <div
                      key={ci}
                      className="h-6 flex-1 rounded-[2px]"
                      style={{ background: seqColor(v / max), minWidth: 18, outline: on ? '2px solid #221E1A' : 'none' }}
                      onPointerEnter={() => setHi({ r: ri, c: ci })}
                      onPointerLeave={() => setHi(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ramp legend */}
      <div className="mt-3 flex items-center gap-2 pl-10">
        <span className="text-[10px] text-muted">less</span>
        <div className="flex gap-[2px]">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((t) => (
            <span key={t} className="h-2.5 w-5 rounded-[2px]" style={{ background: seqColor(t) }} />
          ))}
        </div>
        <span className="text-[10px] text-muted">more</span>
      </div>

      {hi && (
        <div className="pointer-events-none absolute right-0 top-0 rounded border border-line bg-paper px-2.5 py-1.5 text-[11px] shadow-md">
          <div className="font-medium text-ink">
            {rows[hi.r]} · {cols[hi.c]}
          </div>
          <div className="mt-0.5 font-mono font-semibold text-ink">
            {format(values[hi.r]?.[hi.c] ?? 0)}
            {unit}
          </div>
        </div>
      )}
    </div>
  );
}

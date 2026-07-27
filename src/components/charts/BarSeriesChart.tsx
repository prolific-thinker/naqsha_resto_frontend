import { useState } from 'react';
import { useSize } from './useSize';
import { C, shortRs } from './theme';

export type Bar = { label: string; value: number; highlight?: boolean };

type Props = {
  data: Bar[];
  height?: number;
  color?: string;
  /** Colour for the highlighted (peak) bar. */
  peakColor?: string;
  format?: (n: number) => string;
};

const M = { top: 12, right: 8, bottom: 26, left: 44 };

/** Vertical bar series (one measure) with a per-bar hover tooltip. */
export function BarSeriesChart({ data, height = 220, color = '#25604A', peakColor = '#C77D33', format = shortRs }: Props) {
  const [ref, width] = useSize<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);

  const n = data.length;
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const yTicks = 4;
  const gap = 3;
  const bw = n > 0 ? Math.max(2, plotW / n - gap) : 0;
  const bx = (i: number) => M.left + i * (plotW / n) + (plotW / n - bw) / 2;
  const y = (v: number) => M.top + (1 - v / max) * plotH;

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Bar chart" onPointerLeave={() => setHi(null)}>
          {Array.from({ length: yTicks + 1 }).map((_, t) => {
            const v = (max / yTicks) * t;
            const gy = y(v);
            return (
              <g key={t}>
                <line x1={M.left} y1={gy} x2={width - M.right} y2={gy} stroke={C.grid} strokeWidth="1" />
                <text x={M.left - 8} y={gy + 3} textAnchor="end" fontSize="10" fill={C.text}>
                  {shortRs(v)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const h = Math.max(0, plotH - (y(d.value) - M.top));
            const step = Math.ceil(n / Math.max(1, Math.floor(plotW / 32)));
            return (
              <g key={i} onPointerEnter={() => setHi(i)}>
                <rect
                  x={bx(i)}
                  y={y(d.value)}
                  width={bw}
                  height={h}
                  rx="3"
                  fill={d.highlight ? peakColor : color}
                  opacity={hi === null || hi === i ? 1 : 0.55}
                />
                {(i % step === 0 || i === n - 1) && (
                  <text x={bx(i) + bw / 2} y={height - 8} textAnchor="middle" fontSize="10" fill={C.text}>
                    {d.label}
                  </text>
                )}
                {/* invisible hit area for easy hover */}
                <rect x={M.left + i * (plotW / n)} y={M.top} width={plotW / n} height={plotH} fill="transparent" />
              </g>
            );
          })}
        </svg>
      )}

      {hi !== null && data[hi] && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-line bg-paper px-2.5 py-1.5 text-[11px] shadow-md"
          style={{ left: Math.min(width - 110, Math.max(0, bx(hi) - 20)), top: Math.max(0, y(data[hi].value) - 44) }}
        >
          <div className="font-medium text-ink">{data[hi].label}</div>
          <div className="mt-0.5 font-mono font-semibold text-ink">{format(data[hi].value)}</div>
        </div>
      )}
    </div>
  );
}

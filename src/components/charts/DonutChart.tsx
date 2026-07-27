import { useState } from 'react';
import { C } from './theme';

export type Slice = { label: string; value: number; color: string };

type Props = {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  /** Value formatter for the legend/tooltip. */
  format?: (n: number) => string;
};

function arc(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(rOuter, a0);
  const [x1, y1] = p(rOuter, a1);
  const [x2, y2] = p(rInner, a1);
  const [x3, y3] = p(rInner, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0} A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${rInner},${rInner} 0 ${large} 0 ${x3},${y3} Z`;
}

/**
 * Donut for part-to-whole (category / channel share). Identity is never colour
 * alone — every slice is named in the legend with its value + %. Hover raises a
 * slice; a 2px surface gap separates segments.
 */
export function DonutChart({ data, size = 180, centerLabel, centerValue, format = (n) => String(n) }: Props) {
  const [hi, setHi] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter * 0.62;
  const gap = 0.03; // radians of surface gap between segments

  let a = -Math.PI / 2;
  const segs = data.map((d, i) => {
    const frac = d.value / total;
    const a0 = a + gap / 2;
    const a1 = a + frac * Math.PI * 2 - gap / 2;
    a += frac * Math.PI * 2;
    return { d, i, path: arc(cx, cy, rOuter, rInner, a0, Math.max(a0, a1)), pct: frac * 100 };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} role="img" aria-label="Share breakdown" onPointerLeave={() => setHi(null)} className="shrink-0">
        {segs.map((s) => (
          <path
            key={s.i}
            d={s.path}
            fill={s.d.color}
            opacity={hi === null || hi === s.i ? 1 : 0.5}
            onPointerEnter={() => setHi(s.i)}
            style={{ cursor: 'default' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill={C.text}>
          {hi !== null ? `${segs[hi]!.pct.toFixed(0)}%` : centerLabel}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="14" fontWeight="700" fill={C.ink}>
          {hi !== null ? data[hi]!.label : centerValue}
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {segs.map((s) => (
          <li
            key={s.i}
            className="flex items-center gap-2 text-[12.5px]"
            onPointerEnter={() => setHi(s.i)}
            onPointerLeave={() => setHi(null)}
          >
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: s.d.color }} />
            <span className="truncate text-ink">{s.d.label}</span>
            <span className="ml-auto font-mono text-muted">{s.pct.toFixed(0)}%</span>
            <span className="w-16 text-right font-mono font-semibold text-ink">{format(s.d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

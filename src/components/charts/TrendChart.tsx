import { useId, useState } from 'react';
import { useSize } from './useSize';
import { C, shortRs } from './theme';

export type TrendSeries = {
  name: string;
  color: string;
  values: number[];
  /** Render dashed (used for the previous-period comparison). */
  dashed?: boolean;
};

type Props = {
  labels: string[];
  series: TrendSeries[]; // 1–2 series (current + optional previous period)
  height?: number;
  /** Tooltip value formatter; axis uses compact `shortRs`. */
  format?: (n: number) => string;
};

const M = { top: 12, right: 12, bottom: 26, left: 44 };

/**
 * Time-series line + area with an optional previous-period comparison (dashed,
 * muted) and a crosshair tooltip. One y-axis only. Legend shows when >1 series.
 */
export function TrendChart({ labels, series, height = 240, format = shortRs }: Props) {
  const [ref, width] = useSize<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const gid = useId();

  const n = labels.length;
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const allVals = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allVals);
  const yTicks = 4;

  const x = (i: number) => M.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => M.top + (1 - v / max) * plotH;

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const primary = series[0];
  const areaPath =
    primary && n > 1
      ? `${path(primary.values)} L${x(n - 1).toFixed(1)},${M.top + plotH} L${x(0).toFixed(1)},${M.top + plotH} Z`
      : '';

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (width === 0 || n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const i = Math.round(((mx - M.left) / (plotW || 1)) * (n - 1));
    setHi(Math.max(0, Math.min(n - 1, i)));
  };

  const showLegend = series.length > 1;

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Trend chart"
          onPointerMove={onMove}
          onPointerLeave={() => setHi(null)}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary?.color ?? C.up} stopOpacity="0.18" />
              <stop offset="100%" stopColor={primary?.color ?? C.up} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* horizontal grid + y labels */}
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

          {/* x labels — thinned to avoid collisions */}
          {labels.map((lab, i) => {
            const step = Math.ceil(n / Math.max(1, Math.floor(plotW / 48)));
            if (i % step !== 0 && i !== n - 1) return null;
            return (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={C.text}>
                {lab}
              </text>
            );
          })}

          {areaPath && <path d={areaPath} fill={`url(#${gid})`} />}

          {/* previous-period series first (behind), then current */}
          {[...series].reverse().map((s) => (
            <path
              key={s.name}
              d={path(s.values)}
              fill="none"
              stroke={s.dashed ? C.prev : s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '4 4' : undefined}
            />
          ))}

          {/* crosshair + markers */}
          {hi !== null && (
            <g>
              <line x1={x(hi)} y1={M.top} x2={x(hi)} y2={M.top + plotH} stroke={C.axis} strokeWidth="1" />
              {series.map((s) => (
                <circle
                  key={s.name}
                  cx={x(hi)}
                  cy={y(s.values[hi] ?? 0)}
                  r="3.5"
                  fill={C.surface}
                  stroke={s.dashed ? C.prev : s.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>
      )}

      {/* tooltip */}
      {hi !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-line bg-paper px-2.5 py-1.5 text-[11px] shadow-md"
          style={{
            left: Math.min(width - 130, Math.max(0, x(hi) + 8)),
            top: M.top,
          }}
        >
          <div className="font-medium text-ink">{labels[hi]}</div>
          {series.map((s) => (
            <div key={s.name} className="mt-0.5 flex items-center gap-1.5 text-muted">
              <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: s.dashed ? C.prev : s.color }} />
              <span>{s.name}</span>
              <span className="ml-auto font-mono font-semibold text-ink">{format(s.values[hi] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}

      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[2px]"
                style={{ background: s.dashed ? C.prev : s.color, opacity: s.dashed ? 0.9 : 1 }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

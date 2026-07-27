import { useId } from 'react';

type Props = {
  data: number[];
  /** Line/area colour (defaults to green). */
  color?: string;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Tiny inline trend for a KPI card — area + 2px line, no axes, no hover. Decorative
 * support for the headline number, never the primary read.
 */
export function Sparkline({ data, color = '#1F7A55', width = 96, height = 32, className }: Props) {
  const gid = useId();
  if (data.length < 2) return <svg width={width} height={height} className={className} aria-hidden />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const x = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`;

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

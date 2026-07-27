export type HBarRow = {
  label: string;
  value: number;
  /** Optional secondary text under the label (e.g. category, count). */
  sub?: string;
  /** Optional per-row colour; defaults to `barColor`. */
  color?: string;
};

type Props = {
  data: HBarRow[];
  barColor?: string;
  format?: (n: number) => string;
};

/**
 * Ranked horizontal bars (top items / payment mix). Label + value are always
 * visible text — the bar is magnitude support, not the only signal.
 */
export function HBarChart({ data, barColor = '#25604A', format = (n) => String(n) }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="truncate text-ink">
              {d.label}
              {d.sub && <span className="ml-1.5 text-[11px] text-muted">{d.sub}</span>}
            </span>
            <span className="shrink-0 font-mono font-semibold text-ink">{format(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-3">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? barColor }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

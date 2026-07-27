/**
 * Chart palette + tokens for the owner analytics (Frappe-Insights-style dashboard).
 *
 * The categorical order is CVD-validated (dataviz skill `validate_palette.js`,
 * light mode) — worst adjacent ΔE 10.7, all six checks pass. Assign hues in this
 * fixed order, never cycled; a 6th+ series folds into "Other" (muted). Colours are
 * plain hex because SVG `fill`/`stroke` can't take Tailwind classes.
 */

/** Categorical series colours — fixed order (green, gold, plum, orange, blue). */
export const CAT = ['#1F7A55', '#A9861F', '#7E4A86', '#C85D2A', '#2E6FA0'] as const;

/** Folds any overflow / "Other" bucket — a recessive warm grey. */
export const OTHER = '#A99E8E';

/** Sequential ramp (one hue, light→dark green) for magnitude — e.g. the heatmap. */
export const SEQ = ['#EAF2ED', '#CFE3D8', '#A9CDBB', '#79B096', '#4A9270', '#1F7A55'] as const;

/** Structural tokens mirrored from the design system (warm palette). */
export const C = {
  grid: '#E4DBCC', // line
  axis: '#B9AC96', // line-strong
  text: '#7C7267', // muted
  ink: '#221E1A',
  prev: '#B9AC96', // previous-period comparison series (muted, dashed)
  up: '#2E7D5B', // success
  down: '#B23A2E', // alert
  surface: '#FDFBF6', // paper-2
} as const;

/** Pick a categorical colour by index, folding overflow into OTHER. */
export function catColor(i: number): string {
  return i < CAT.length ? CAT[i]! : OTHER;
}

/** Map a 0..1 intensity onto the sequential ramp. */
export function seqColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SEQ.length - 1));
  return SEQ[idx]!;
}

/** Compact rupee axis labels: 12.3k / 1.2M. */
export function shortRs(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

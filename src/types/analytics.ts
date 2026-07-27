/**
 * Owner analytics ("Insights") domain types. One composed payload per date range,
 * so the dashboard renders every widget from a single fetch — mirrors what a
 * Frappe `naqsha.api.insights(range)` whitelisted method would return.
 */

export type AnalyticsRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type DeltaTone = 'up' | 'down' | 'flat';

/** A headline metric with a previous-period delta and a sparkline. */
export type Kpi = {
  key: string;
  label: string;
  value: string; // preformatted for display
  raw: number;
  unit?: string;
  deltaPct: number; // vs previous period
  deltaTone: DeltaTone;
  /** `true` when a downward delta is actually good (e.g. food-cost %). */
  invertGood?: boolean;
  spark: number[];
};

export type SeriesPoint = { label: string; value: number };

/** A part-to-whole slice; the UI assigns the categorical colour by index. */
export type CategoryShare = { label: string; value: number };

export type RankRow = { label: string; sub?: string; value: number };

export type OwnerInsights = {
  rangeLabel: string; // "Last 7 days · 12–18 Jul"
  compareLabel: string; // "vs previous 7 days"
  kpis: Kpi[];
  revenueTrend: { labels: string[]; current: number[]; previous: number[] };
  salesByCategory: CategoryShare[];
  salesByHour: SeriesPoint[];
  busyHeatmap: { days: string[]; hours: string[]; values: number[][] };
  paymentMix: CategoryShare[];
  channelMix: CategoryShare[];
  topItems: RankRow[];
  discountsTotal: number;
  voidsTotal: number;
  refundsTotal: number;
  avgPrepSeconds: number;
};

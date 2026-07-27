import { money } from '@/lib/format';
import type { AnalyticsRange, DeltaTone, Kpi, OwnerInsights } from '@/types/analytics';

/**
 * Deterministic owner-analytics generator. Produces a realistic, self-consistent
 * payload per date range so the dashboard filters + comparison feel live without a
 * backend. A live `naqsha.api.insights(range)` returns the same shape.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type RangeCfg = { pts: number; factor: number; rangeLabel: string; compareLabel: string; labels: string[] };

const HOUR_LABELS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

function rangeConfig(range: AnalyticsRange): RangeCfg {
  switch (range) {
    case 'day':
      return { pts: 14, factor: 1, rangeLabel: 'Today · Wed 16 Jul', compareLabel: 'vs yesterday', labels: HOUR_LABELS };
    case 'week':
      return { pts: 7, factor: 6.6, rangeLabel: 'Last 7 days · 10–16 Jul', compareLabel: 'vs previous 7 days', labels: DOW };
    case 'month':
      return {
        pts: 30,
        factor: 28,
        rangeLabel: 'Last 30 days · 17 Jun – 16 Jul',
        compareLabel: 'vs previous 30 days',
        labels: Array.from({ length: 30 }, (_, i) => String(i + 1)),
      };
    case 'quarter':
      return {
        pts: 13,
        factor: 88,
        rangeLabel: 'Last quarter · Apr – Jun',
        compareLabel: 'vs previous quarter',
        labels: Array.from({ length: 13 }, (_, i) => `W${i + 1}`),
      };
    case 'year':
      return { pts: 12, factor: 340, rangeLabel: 'Last 12 months', compareLabel: 'vs previous year', labels: MONTHS };
  }
}

/** A day/hour demand curve, normalised to ~1.0 mean. */
function demandShape(n: number): number[] {
  // two peaks (lunch + dinner) for hourly; smooth ripple otherwise
  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1);
    const lunch = Math.exp(-((t - 0.33) ** 2) / 0.02);
    const dinner = Math.exp(-((t - 0.8) ** 2) / 0.03);
    return 0.5 + 0.9 * dinner + 0.5 * lunch;
  });
}

function kpi(
  key: string,
  label: string,
  raw: number,
  value: string,
  deltaPct: number,
  rnd: () => number,
  opts: { unit?: string; invertGood?: boolean } = {},
): Kpi {
  const tone: DeltaTone = deltaPct === 0 ? 'flat' : deltaPct > 0 ? 'up' : 'down';
  const spark = Array.from({ length: 12 }, (_, i) => {
    const base = raw * (0.82 + (i / 11) * 0.18);
    return Math.round(base * (0.94 + rnd() * 0.12));
  });
  return { key, label, raw, value, deltaPct, deltaTone: tone, spark, unit: opts.unit, invertGood: opts.invertGood };
}

export function buildInsights(range: AnalyticsRange): OwnerInsights {
  const cfg = rangeConfig(range);
  const rnd = mulberry32(hashStr(range));
  const f = cfg.factor;

  const netSales = Math.round(78340 * f);
  const orders = Math.round(32 * f);
  const covers = Math.round(148 * f);
  const avgTicket = Math.round(netSales / orders);
  const foodCostPct = +(40 + rnd() * 3).toFixed(1);
  const netMarginPct = +(34 + rnd() * 5).toFixed(1);

  // revenue trend (current + previous period)
  const shape = demandShape(cfg.pts);
  const shapeSum = shape.reduce((s, v) => s + v, 0);
  const current = shape.map((v) => Math.round((v / shapeSum) * netSales * (0.9 + rnd() * 0.2)));
  const prevFactor = 0.86 + rnd() * 0.1;
  const previous = current.map((v) => Math.round(v * prevFactor * (0.92 + rnd() * 0.16)));

  const share = (pct: number) => Math.round(netSales * pct);
  const salesByCategory = [
    { label: 'Main kitchen', value: share(0.38) },
    { label: 'BBQ & grill', value: share(0.27) },
    { label: 'Drinks & coffee', value: share(0.16) },
    { label: 'Desserts', value: share(0.11) },
    { label: 'Sides', value: share(0.08) },
  ];

  const hourShape = demandShape(14);
  const hourSum = hourShape.reduce((s, v) => s + v, 0);
  const salesByHour = HOUR_LABELS.map((h, i) => ({
    label: h,
    value: Math.round((hourShape[i]! / hourSum) * netSales * (0.9 + rnd() * 0.2)),
  }));

  // busy heatmap: 7 days × 14 hours, weekend-dinner heavy
  const busyValues = DOW.map((_, di) => {
    const weekend = di >= 4 ? 1.35 : 1;
    return HOUR_LABELS.map((_, hi) => Math.round(hourShape[hi]! * weekend * (6 + rnd() * 6)));
  });

  const paymentMix = [
    { label: 'Cash', value: share(0.46) },
    { label: 'Card', value: share(0.24) },
    { label: 'JazzCash', value: share(0.18) },
    { label: 'Easypaisa', value: share(0.12) },
  ];
  const channelMix = [
    { label: 'Dine-in', value: share(0.68) },
    { label: 'QR order & pay', value: share(0.22) },
    { label: 'Kiosk', value: share(0.1) },
  ];

  const topItems = [
    { label: 'Chicken karahi', sub: `${Math.round(24 * f)}× · Main`, value: Math.round(28320 * f) },
    { label: 'Beef bihari', sub: `${Math.round(18 * f)}× · BBQ`, value: Math.round(20520 * f) },
    { label: 'Chicken tikka', sub: `${Math.round(14 * f)}× · BBQ`, value: Math.round(12460 * f) },
    { label: 'Karak chai', sub: `${Math.round(42 * f)}× · Drinks`, value: Math.round(10500 * f) },
    { label: 'Café latte', sub: `${Math.round(18 * f)}× · Drinks`, value: Math.round(9360 * f) },
    { label: 'Malai boti', sub: `${Math.round(9 * f)}× · BBQ`, value: Math.round(8280 * f) },
  ];

  const kpis: Kpi[] = [
    kpi('net_sales', 'Net sales', netSales, `₨ ${money(netSales)}`, +(6 + rnd() * 10).toFixed(1), rnd),
    kpi('orders', 'Orders', orders, money(orders), +(3 + rnd() * 8).toFixed(1), rnd),
    kpi('avg_ticket', 'Avg ticket', avgTicket, `₨ ${money(avgTicket)}`, +(1 + rnd() * 6).toFixed(1), rnd),
    kpi('covers', 'Covers', covers, money(covers), +(4 + rnd() * 9).toFixed(1), rnd),
    kpi('food_cost', 'Food cost', foodCostPct, `${foodCostPct}%`, +(-(rnd() * 4).toFixed(1)), rnd, {
      unit: '%',
      invertGood: true,
    }),
    kpi('net_margin', 'Net margin', netMarginPct, `${netMarginPct}%`, +(1 + rnd() * 4).toFixed(1), rnd, { unit: '%' }),
  ];

  return {
    rangeLabel: cfg.rangeLabel,
    compareLabel: cfg.compareLabel,
    kpis,
    revenueTrend: { labels: cfg.labels, current, previous },
    salesByCategory,
    salesByHour,
    busyHeatmap: { days: DOW, hours: HOUR_LABELS, values: busyValues },
    paymentMix,
    channelMix,
    topItems,
    discountsTotal: Math.round(netSales * 0.03),
    voidsTotal: Math.round(netSales * 0.006),
    refundsTotal: Math.round(netSales * 0.004),
    avgPrepSeconds: 512,
  };
}

import { z } from 'zod';

/** Zod schemas for the owner analytics payload — the fetch-boundary contract. */

const KpiSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  raw: z.number(),
  unit: z.string().optional(),
  deltaPct: z.number(),
  deltaTone: z.enum(['up', 'down', 'flat']),
  invertGood: z.boolean().optional(),
  spark: z.array(z.number()),
});

const SeriesPointSchema = z.object({ label: z.string(), value: z.number() });
const CategoryShareSchema = z.object({ label: z.string(), value: z.number() });
const RankRowSchema = z.object({ label: z.string(), sub: z.string().optional(), value: z.number() });

export const OwnerInsightsSchema = z.object({
  rangeLabel: z.string(),
  compareLabel: z.string(),
  kpis: z.array(KpiSchema),
  revenueTrend: z.object({
    labels: z.array(z.string()),
    current: z.array(z.number()),
    previous: z.array(z.number()),
  }),
  salesByCategory: z.array(CategoryShareSchema),
  salesByHour: z.array(SeriesPointSchema),
  busyHeatmap: z.object({
    days: z.array(z.string()),
    hours: z.array(z.string()),
    values: z.array(z.array(z.number())),
  }),
  paymentMix: z.array(CategoryShareSchema),
  channelMix: z.array(CategoryShareSchema),
  topItems: z.array(RankRowSchema),
  discountsTotal: z.number(),
  voidsTotal: z.number(),
  refundsTotal: z.number(),
  avgPrepSeconds: z.number(),
});

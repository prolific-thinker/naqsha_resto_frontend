import { format as formatDate, parseISO } from 'date-fns';
import { money, pkr } from '@/lib/format';
import type { OwnerDashboard } from '@/types/domain';
import type { SrvOwnerDashboard } from '@/types/server';
import { plural } from './shared';

/**
 * `owner.dashboard` → `OwnerDashboardSchema`.
 *
 * The widest gap in the app: the server returns figures, the schema wants a rendered
 * dashboard (greeting, percentage strings, bar heights, delta tones). Everything below
 * is either a real number, a join, or an honestly-worded label — nothing is invented.
 */

export type OwnerContext = {
  /** From auth.session.fullName. */
  ownerName: string;
  /**
   * item code → category. Now only a fallback: `owner.dashboard` carries
   * `bestDishes[].category` itself, so the client-side join against menu.items is no
   * longer load-bearing. Kept for a backend that predates that field.
   */
  categoryByCode: Map<string, string>;
};

function safeDate(iso: string): Date | null {
  try {
    return parseISO(iso);
  } catch {
    return null;
  }
}

export function toOwnerDashboard(raw: SrvOwnerDashboard, ctx: OwnerContext): OwnerDashboard {
  const s = raw.miniStats;
  const from = safeDate(raw.fromDate);
  const to = safeDate(raw.toDate);

  const revenue = raw.pnl.find((l) => /revenue/i.test(l.label))?.amount ?? s.netSales;
  const netProfitRow = raw.pnl.find((l) => /net profit/i.test(l.label)) ?? raw.pnl[raw.pnl.length - 1];

  const pct = (amount: number): string =>
    revenue ? `${((Math.abs(amount) / revenue) * 100).toFixed(1)}%` : '—';

  const lines = raw.pnl.map((l) => ({
    label: l.indent === 1 ? `— ${l.label}` : l.label,
    value: l.amount,
    pct: /revenue/i.test(l.label) ? '100%' : pct(l.amount),
  }));

  // Wastage is real, approved, period-scoped money that the GL rollup does not break
  // out. Adding it as its own line closes a chunk of the visual gap with real data.
  if (s.wastageValue) {
    lines.splice(Math.max(0, lines.length - 1), 0, {
      label: '— Wastage',
      value: -Math.abs(s.wastageValue),
      pct: pct(s.wastageValue),
    });
  }

  // `pct` here is a BAR HEIGHT, not a share of revenue — the component writes it
  // straight into `style={{height: `${pct}%`}}`. Normalise against the max.
  const hours = raw.revenueByHour ?? [];
  const max = hours.reduce((m, h) => Math.max(m, h.amount), 0);
  const peak = hours.find((h) => h.amount === max && max > 0);

  // The server only emits hours that had an invoice, so a quiet 14:00 vanishes and
  // every later bar shifts left. Fill the gaps so the axis stays truthful.
  const filled: { hour: string; pct: number; peak?: boolean }[] = [];
  if (hours.length) {
    const nums = hours.map((h) => Number(h.hour.slice(0, 2)));
    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    for (let h = lo; h <= hi; h += 1) {
      const key = String(h).padStart(2, '0');
      const found = hours.find((x) => x.hour.slice(0, 2) === key);
      filled.push({
        hour: key,
        pct: max ? Math.round(((found?.amount ?? 0) / max) * 100) : 0,
        peak: found ? found.amount === max && max > 0 : undefined,
      });
    }
  }

  const dishes = (raw.bestDishes ?? []).slice(0, 6);
  const top = dishes[0];

  return {
    greet: to
      ? `${formatDate(to, 'EEE d MMMM')} · ${raw.period === 'day' ? 'closing summary' : `${raw.period} summary`}`
      : `${raw.period} summary`,
    ownerName: ctx.ownerName.split(' ')[0] ?? ctx.ownerName,
    lead: `${s.orderCount} ${plural(s.orderCount, 'order')} · ${s.covers} covers · net ${pkr(s.netSales)}`,
    pnl: {
      netProfit: netProfitRow?.amount ?? 0,
      periodLabel:
        from && to ? `${formatDate(from, 'd MMM')} – ${formatDate(to, 'd MMM')}` : raw.period,
      // A real period-over-period comparison, now that `owner.dashboard` returns a
      // `previous` block. When the previous window had no sales there is no baseline,
      // and saying so is better than drawing a 0% arrow.
      deltaLabel: raw.previous?.netSales
        ? `${s.netSales >= raw.previous.netSales ? '↑' : '↓'} ${Math.abs(
            ((s.netSales - raw.previous.netSales) / raw.previous.netSales) * 100,
          ).toFixed(1)}% vs previous ${raw.period}`
        : `${s.orderCount} ${plural(s.orderCount, 'invoice')} · no prior ${raw.period}`,
      lines,
    },
    miniStats: [
      {
        label: 'Net sales',
        value: pkr(s.netSales),
        delta: `${s.orderCount} ${plural(s.orderCount, 'order')}`,
        deltaTone: 'up',
        aux: `${s.covers} covers`,
      },
      {
        label: 'Avg ticket',
        value: pkr(s.avgTicket),
        delta: s.covers ? `₨ ${money(s.netSales / s.covers)} / cover` : '—',
        deltaTone: 'up',
        aux: `${s.orderCount} ${plural(s.orderCount, 'ticket')}`,
      },
      {
        label: 'Food cost',
        value: `${s.foodCostPct}%`,
        delta: s.foodCostPct > 35 ? '↑ above target' : '↓ within target',
        deltaTone: s.foodCostPct > 35 ? 'down' : 'up',
        aux: 'target 35%',
      },
      {
        label: 'Wastage',
        value: pkr(s.wastageValue),
        delta: 'approved this period',
        deltaTone: s.wastageValue > 0 ? 'down' : 'muted',
        aux: '',
      },
    ],
    revenueByHour: filled,
    peakNote: peak ? `Peak · ${peak.hour} · ${pkr(peak.amount)}` : 'No sales in this period',
    bestDishes: dishes.map((d, i) => ({
      rank: i + 1,
      name: d.name,
      category: d.category || ctx.categoryByCode.get(d.code) || '',
      count: Math.round(d.qty),
      revenue: d.amount,
    })),
    bottomNote: top
      ? `${dishes.length} ${plural(dishes.length, 'dish')} ranked · top ${top.name} at ${pkr(top.amount)}`
      : 'No dishes sold in this period',
  };
}

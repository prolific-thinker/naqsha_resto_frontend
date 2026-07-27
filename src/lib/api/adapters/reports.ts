import type { BranchRow, ItemPerfRow, PnlReport } from '@/types/erp';
import type { SrvBranches, SrvItemPerformance, SrvPnl } from '@/types/server';
import { dayTick, rangeLabel } from './shared';

/** `reports.pnl` / `.item_performance` / `.branches` → the owner report view models. */

export function toPnlReport(raw: SrvPnl): PnlReport {
  const revenue = raw.revenue;

  return {
    periodLabel: rangeLabel(raw.fromDate, raw.toDate),
    netProfit: raw.netProfit,
    deltaLabel: deltaLabel(raw.netProfit, raw.previous.netProfit),
    deltaTone: tone(raw.netProfit, raw.previous.netProfit),
    lines: raw.lines.map((line) => ({
      label: line.indent === 1 ? `— ${line.label}` : line.label,
      value: line.amount,
      indent: line.indent,
      // Every line as a share of revenue, which is how a restaurant P&L is read:
      // "COGS is 31% of sales", not "COGS is 31% of the biggest line".
      pct: /revenue/i.test(line.label)
        ? '100%'
        : revenue
          ? `${((Math.abs(line.amount) / revenue) * 100).toFixed(1)}%`
          : '—',
    })),
    trend: raw.trend.map((point) => ({ label: dayTick(point.date), revenue: point.revenue })),
  };
}

export function toItemPerfRows(raw: SrvItemPerformance): ItemPerfRow[] {
  return raw.rows.map((row, i) => ({
    rank: i + 1,
    name: row.name,
    category: row.category,
    qty: Math.round(row.qty),
    revenue: row.revenue,
    sharePct: row.sharePct,
  }));
}

export function toBranchRows(raw: SrvBranches): BranchRow[] {
  return raw.rows.map((row) => ({
    branch: row.branch,
    revenue: row.revenue,
    orders: row.orders,
    avgTicket: row.avgTicket,
    // `deltaPct === null` means the previous window had no sales at all. That is not
    // "flat" and must not render as a 0% arrow — a first week of trading would look
    // like a business that had stopped growing.
    deltaLabel:
      row.deltaPct === null
        ? 'no prior period'
        : `${row.deltaPct > 0 ? '↑' : row.deltaPct < 0 ? '↓' : '→'} ${Math.abs(row.deltaPct)}%`,
    deltaTone: row.deltaPct === null ? 'muted' : row.deltaPct > 0 ? 'up' : row.deltaPct < 0 ? 'down' : 'muted',
  }));
}

function deltaLabel(current: number, previous: number): string {
  if (!previous) return 'no prior period';
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
  return `${arrow} ${Math.abs(pct).toFixed(1)}% vs previous`;
}

function tone(current: number, previous: number): 'up' | 'down' | 'muted' {
  if (!previous) return 'muted';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'muted';
}

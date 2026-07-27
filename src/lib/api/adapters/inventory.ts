import type { Bom, CogsSummary, StockRow } from '@/types/erp';
import type { SrvBom, SrvCogs, SrvStockRow } from '@/types/server';
import { opt, rangeLabel } from './shared';

/**
 * `inventory.stock_levels` / `.boms` / `.cogs` → the inventory screen's view models.
 */

export function toStockRow(raw: SrvStockRow): StockRow {
  return {
    code: raw.itemCode,
    name: raw.itemName,
    warehouse: raw.warehouse,
    actualQty: raw.actualQty,
    uom: raw.uom ?? '',
    reorderLevel: raw.reorderLevel,
    valuationRate: raw.valuationRate,
    // Order matters: an item can be both out AND below its reorder level, and "out"
    // is the one that stops service.
    status: raw.isOut ? 'out' : raw.isLow ? 'low' : 'ok',
  };
}

/**
 * A recipe card is rendered **per portion**, not per batch.
 *
 * `BOM.quantity` is the batch size — the Butter Chicken recipe yields four plates.
 * Showing batch line amounts next to a single portion's selling price is how a 25%
 * food cost gets displayed as 99%. Every money and quantity figure below is divided
 * by the batch so the whole card is on one scale, and `portions` states which.
 */
export function toBom(raw: SrvBom): Bom {
  const batch = raw.quantity || 1;
  return {
    id: raw.bom,
    itemCode: raw.itemCode,
    itemName: raw.itemName ?? raw.itemCode,
    portions: batch,
    sellPrice: raw.sellPrice,
    totalCost: raw.unitCost,
    foodCostPct: raw.foodCostPct,
    lines: raw.lines.map((line) => ({
      name: line.itemName ?? line.itemCode,
      qty: round3(line.qty / batch),
      uom: line.uom ?? '',
      rate: line.rate,
      amount: round2(line.amount / batch),
    })),
  };
}

export function toCogsSummary(raw: SrvCogs): CogsSummary {
  return {
    periodLabel: rangeLabel(raw.fromDate, raw.toDate),
    revenue: raw.revenue,
    cogs: raw.cogs,
    foodCostPct: raw.foodCostPct,
    grossProfit: raw.grossProfit,
    uncostedRevenue: opt(raw.uncostedRevenue),
    byCategory: raw.byCategory.map((c) => ({
      category: c.category,
      cost: c.cost,
      pct: c.pct,
    })),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Three places for quantities, not two: 0.06 Kg of masala across an 8-portion batch
 *  is 0.0075 Kg, which two-place rounding turns into 0.01 — a 33% error on the
 *  costliest ingredient in the recipe. */
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

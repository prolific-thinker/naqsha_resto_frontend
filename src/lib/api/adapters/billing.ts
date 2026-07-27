import type { OrderBatch, PosInvoice, Station } from '@/types/domain';
import type { SrvInvoice } from '@/types/server';
import { opt, hhmm, humanDuration, sinceSeconds, station } from './shared';

/** `billing.get_invoice` → `PosInvoiceSchema`. */

export type InvoiceContext = {
  /** item code → station, joined from the menu so each bill line can show its origin. */
  stationByCode: Map<string, Station>;
  /** The table's `openedAt`, joined from the floor — the invoice payload has no session start. */
  openedAt?: string | null;
};

export function toPosInvoice(
  raw: SrvInvoice,
  ctx: InvoiceContext,
  now: number = Date.now(),
): PosInvoice {
  const batches: OrderBatch[] = (raw.batches ?? []).map((b) => ({
    // "Order 2" → "Order 2 @ 19:22". BatchMarker is built for the longer form.
    label: b.label ? (b.firedAt ? `${b.label} @ ${hhmm(b.firedAt)}` : b.label) : null,
    lines: (b.lines ?? []).map((l) => ({
      qty: l.qty,
      name: l.name,
      // Not on the invoice payload — joined from the menu, defaulted rather than
      // dropped so the line still renders if an item was deleted since it was sold.
      station: ctx.stationByCode.get(l.code) ?? station('main'),
      rate: l.rate,
      amount: l.amount,
    })),
  }));

  // "Subtotal · N items" counts covers-worth of items, not line rows.
  const subtotalItems = Math.round(
    batches.reduce((sum, b) => sum + b.lines.reduce((s, l) => s + l.qty, 0), 0),
  );

  const openSeconds = sinceSeconds(ctx.openedAt, now);

  return {
    ref: raw.ref,
    tableRef: raw.tableRef ?? '—',
    tableNumber: raw.tableNumber ?? raw.tableRef ?? '—',
    pax: raw.pax ?? 0,
    waiter: { id: '', name: raw.waiter ?? 'Unassigned' },
    openedAtLabel: hhmm(ctx.openedAt) ?? '—',
    durationLabel: openSeconds === undefined ? '—' : humanDuration(openSeconds),
    batches,
    subtotalItems,
    subtotal: raw.subtotal,
    serviceChargePct: raw.serviceChargePct,
    serviceCharge: raw.serviceChargeAmount,
    discount: raw.discountAmount ? -Math.abs(raw.discountAmount) : undefined,
    discountLabel: raw.discountAmount
      ? raw.couponCode
        ? `Coupon ${raw.couponCode}`
        : 'Discount'
      : undefined,
    couponRef: opt(raw.couponRef),
    couponCode: opt(raw.couponCode),
    taxes: (raw.taxes ?? []).map((t) => ({
      description: t.description,
      rate: t.rate,
      amount: t.amount,
    })),
    // The ROUNDED total, deliberately. pay_invoice rejects a payment under
    // `rounded_total`, so the number on screen has to be the number the payment
    // must match — otherwise a cashier tenders exact change and gets UNDERPAID.
    grandTotal: raw.roundedTotal || raw.grandTotal,
    modesOfPayment: raw.modesOfPayment,
  };
}

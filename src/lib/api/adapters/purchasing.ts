import type { PurchaseOrder, Supplier } from '@/types/erp';
import type { SrvPurchaseOrder, SrvSupplier } from '@/types/server';
import { dayShort, opt } from './shared';

/** `purchasing.orders` / `.suppliers` → the purchasing screen's view models. */

export function toPurchaseOrder(raw: SrvPurchaseOrder): PurchaseOrder {
  const received = raw.receivedPct;
  return {
    ref: raw.ref,
    supplier: raw.supplierName,
    status: raw.status,
    statusLabel: raw.statusLabel,
    dateLabel: dayShort(raw.date),
    // A partially-received order is the one a manager most needs to see, and the
    // ERPNext status alone ("To Receive and Bill") does not say how far along it is.
    scheduleLabel:
      received > 0 && received < 100
        ? `${dayShort(raw.scheduleDate)} · ${received}% received`
        : dayShort(raw.scheduleDate),
    total: raw.total,
    receivedPct: received,
    lines: raw.lines.map((line) => ({
      name: line.itemName ?? line.itemCode,
      qty: line.qty,
      uom: line.uom ?? '',
      rate: line.rate,
      amount: line.amount,
    })),
  };
}

export function toSupplier(raw: SrvSupplier): Supplier {
  return {
    id: raw.id,
    name: raw.name,
    group: raw.group,
    phone: raw.phone,
    city: opt(raw.city),
    outstanding: raw.outstanding,
  };
}

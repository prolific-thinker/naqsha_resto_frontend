import type { Customer, CustomerVisit } from '@/types/erp';
import type { SrvCustomer, SrvCustomerVisit } from '@/types/server';
import { dayShort, sinceLabel } from './shared';

/** `crm.customers` / `.customer_history` → the CRM screen's view models. */

export function toCustomer(raw: SrvCustomer): Customer {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    group: raw.group,
    // Prefer the last visit over the record's creation date. "since Jul 2026" on a
    // customer who last came in January is the wrong fact on a retention screen.
    sinceLabel: raw.lastVisit ? `last visit ${dayShort(raw.lastVisit)}` : sinceLabel(raw.since),
    visits: raw.visits,
    totalSpend: raw.totalSpend,
    loyaltyPoints: raw.loyaltyPoints,
    tags: raw.tags,
  };
}

export function toCustomerVisit(raw: SrvCustomerVisit): CustomerVisit {
  return {
    invoiceRef: raw.invoice,
    dateLabel: raw.time ? `${dayShort(raw.date)} · ${raw.time}` : dayShort(raw.date),
    amount: raw.amount,
    itemsLabel: raw.itemsLabel,
  };
}

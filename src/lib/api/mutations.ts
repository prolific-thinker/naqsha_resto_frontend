import { apiPost, isFailure, resourceCreate, resourceGet, type Failure } from './http';
import { METHODS, RESOURCE } from './endpoints';
import type { CartLine } from '@/types/domain';
import type {
  SrvAdvanceResult,
  SrvCampaign,
  SrvCoupon,
  SrvOrderResult,
  SrvPaymentResult,
  SrvReservation,
  SrvTableAction,
  SrvWaitlistEntry,
} from '@/types/server';
import type { CampaignAudience, CampaignChannel, ReservationStatus } from '@/types/erp';

/**
 * Every write in the app.
 *
 * These return the `Result | Failure` union rather than throwing on a business
 * failure, because callers need to branch on `code` — an `ILLEGAL_TRANSITION` from a
 * double-tapped tablet must not raise an error toast, while `UNDERPAID` must.
 * Genuine faults (network, 4xx/5xx, CSRF) still throw.
 */

export type Result<T> = T | Failure;

// ---------------------------------------------------------------------------
// Floor
// ---------------------------------------------------------------------------

export function openTable(table: string, pax: number): Promise<Result<SrvTableAction>> {
  return apiPost<SrvTableAction>(METHODS.openTable, { table, pax });
}

export function dispatchTable(table: string): Promise<Result<SrvTableAction>> {
  return apiPost<SrvTableAction>(METHODS.dispatchTable, { table });
}

export function closeTable(table: string, note?: string): Promise<Result<SrvTableAction>> {
  return apiPost<SrvTableAction>(METHODS.closeTable, { table, note });
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

function toLines(lines: CartLine[]) {
  // `CartLine.itemId` IS the Item code — MenuItem.id is mapped from `code`.
  return lines.map((l) => ({ code: l.itemId, qty: l.qty, comment: l.note ?? null }));
}

/**
 * Fire an order.
 *
 * `hasOpenOrder` decides create-vs-append, and it is a correctness question rather
 * than a nicety: `submit_order` has no guard against a table that already has an open
 * Sales Order, so calling it twice would leave the table with two — and the bill only
 * follows one of them.
 */
export function submitOrder(args: {
  table: string;
  pax: number;
  lines: CartLine[];
  offlineRef: string;
  hasOpenOrder: boolean;
}): Promise<Result<SrvOrderResult>> {
  const items = toLines(args.lines);

  if (args.hasOpenOrder) {
    return apiPost<SrvOrderResult>(METHODS.appendItems, { table: args.table, items });
  }
  return apiPost<SrvOrderResult>(METHODS.submitOrder, {
    table: args.table,
    pax: args.pax,
    items,
    offlineRef: args.offlineRef,
  });
}

// ---------------------------------------------------------------------------
// KDS
// ---------------------------------------------------------------------------

/** No offlineRef: `states.advance_kot` is idempotent by construction (a repeat of the
 *  current state returns ok). */
export function advanceKot(kot: string, to: 'preparing' | 'prepared'): Promise<Result<SrvAdvanceResult>> {
  return apiPost<SrvAdvanceResult>(METHODS.advanceKot, { kot, to });
}

/**
 * Ask a station to hurry a ticket. Manager+ on the server.
 *
 * No offlineRef, and none is needed: re-escalating answers `ALREADY_ESCALATED` as a
 * business failure rather than double-stamping the audit trail, so a retried or
 * double-tapped call cannot produce a second escalation.
 */
export function escalateKot(kot: string, note?: string): Promise<Result<{ kot: string }>> {
  return apiPost<{ kot: string }>(METHODS.escalateKot, { kot, note });
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export function payInvoice(args: {
  invoice: string;
  payments: { mode: string; amount: number; reference?: string }[];
  offlineRef: string;
}): Promise<Result<SrvPaymentResult>> {
  return apiPost<SrvPaymentResult>(METHODS.payInvoice, {
    invoice: args.invoice,
    payments: args.payments,
    offlineRef: args.offlineRef,
  });
}

export function updateInvoice(args: {
  invoice: string;
  discountPercentage?: number;
  serviceChargePct?: number;
  customerPhone?: string;
  /** The code the guest quotes ("EID25"); the server resolves it to the document. */
  couponCode?: string;
}): Promise<unknown> {
  return apiPost(METHODS.updateInvoice, args);
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function toggle86(item: string, is86: boolean, reason?: string): Promise<Result<{ ok: boolean }>> {
  return apiPost<{ ok: boolean }>(METHODS.toggle86, { item, is86, reason });
}

// ---------------------------------------------------------------------------
// Wastage
// ---------------------------------------------------------------------------

export type WastageDraft = {
  reason: string;
  branch: string;
  note?: string;
  items: { item: string; qty: number; uom?: string }[];
};

/**
 * File a wastage entry.
 *
 * Deliberately two calls and no custom method: the Frappe Workflow is the enforcement
 * (PLAN_FRAPPE_BACKEND.md §5.3), so a bespoke write endpoint would be a way around it.
 *
 * Note `apply_workflow` takes the WHOLE document, not a name — and the Draft→Pending
 * transition carries `condition: "doc.items"`, so an empty items table is refused
 * silently. `rate`, `amount`, `total_value`, `reported_by` and `reported_at` are all
 * server-set; sending them is pointless and a client `rate` is overwritten by design.
 *
 * There is no `offline_ref` on Wastage Entry, so this must not be retried — see
 * useWastageActions.
 */
export async function submitWastage(draft: WastageDraft): Promise<{ name: string }> {
  const doc = await resourceCreate<{ name: string }>(RESOURCE.wastageEntry, {
    reason: draft.reason,
    branch: draft.branch,
    note: draft.note,
    items: draft.items.map((i) => ({ item: i.item, qty: i.qty, uom: i.uom })),
  });
  await apiPost(METHODS.applyWorkflow, { doc, action: 'Submit' });
  return doc;
}

/** Owner approve / reject. Re-reads the doc because apply_workflow needs all of it. */
export async function decideWastage(name: string, action: 'Approve' | 'Reject'): Promise<void> {
  const doc = await resourceGet(RESOURCE.wastageEntry, name);
  const res = await apiPost(METHODS.applyWorkflow, { doc, action });
  if (isFailure(res)) throw new Error(res.message);
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export function clock(logType: 'IN' | 'OUT'): Promise<Result<{ ok: boolean }>> {
  return apiPost<{ ok: boolean }>(METHODS.clock, { logType });
}

export function assignShift(args: {
  employee: string;
  shiftType: string;
  startDate?: string;
  endDate?: string;
}): Promise<Result<{ ok: true; assignment: string }>> {
  return apiPost(METHODS.assignShift, args);
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export type StockAdjustmentLine = { code: string; qty: number; rate?: number };

/**
 * Post a stock adjustment.
 *
 * `purpose` is the ERPNext Stock Entry Type verbatim, not a friendly word: the server
 * refuses anything other than these two so an adjustment cannot silently become a
 * transfer. No `offlineRef` — Stock Entry has no dedupe field of ours, so this must
 * never be retried automatically.
 */
export function adjustStock(args: {
  purpose: 'Material Receipt' | 'Material Issue';
  items: StockAdjustmentLine[];
  warehouse?: string;
  note?: string;
}): Promise<Result<{ ok: true; entry: string }>> {
  return apiPost(METHODS.adjustStock, args);
}

// ---------------------------------------------------------------------------
// Purchasing
// ---------------------------------------------------------------------------

export function createSupplier(args: {
  name: string;
  group?: string;
  phone?: string;
  city?: string;
}): Promise<Result<{ ok: true; supplier: string }>> {
  return apiPost(METHODS.createSupplier, args);
}

export function createPurchaseOrder(args: {
  supplier: string;
  items: { code: string; qty: number; rate: number }[];
  scheduleDate?: string;
}): Promise<Result<{ ok: true; order: string; total: number }>> {
  return apiPost(METHODS.createPurchaseOrder, args);
}

/** Receive a submitted PO in full, as a Purchase Receipt. Partial receipt is Desk. */
export function receivePurchaseOrder(
  order: string,
): Promise<Result<{ ok: true; receipt: string }>> {
  return apiPost(METHODS.receivePurchaseOrder, { order });
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export function saveCustomer(args: {
  customer?: string;
  name?: string;
  phone?: string;
  group?: string;
}): Promise<Result<{ ok: true; customer: string }>> {
  return apiPost(METHODS.saveCustomer, args);
}

// ---------------------------------------------------------------------------
// Guest
// ---------------------------------------------------------------------------

export function guestPlaceOrder(args: {
  slug: string;
  items: { code: string; qty: number; comment?: string | null }[];
  phone?: string;
  offlineRef: string;
}): Promise<Result<{ ok: true; order: string; eta: number }>> {
  return apiPost(
    METHODS.guestPlaceOrder,
    { t: args.slug, items: args.items, phone: args.phone, offlineRef: args.offlineRef },
    { authScope: 'guest' },
  );
}

// ---------------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------------

export function saveCampaign(args: {
  campaign?: string;
  name?: string;
  channel?: CampaignChannel;
  audience?: CampaignAudience;
  scheduledAt?: string | null;
  description?: string;
}): Promise<Result<SrvCampaign>> {
  return apiPost<SrvCampaign>(METHODS.saveCampaign, args);
}

/**
 * Records a campaign as sent and returns its recipients.
 *
 * `delivered` comes back `false`: there is no messaging gateway on this deployment, so
 * nothing is transmitted. The screen says so rather than implying a send happened.
 */
export function sendCampaign(campaign: string): Promise<
  Result<{
    campaign: string;
    channel: string;
    delivered: boolean;
    reach: number;
    recipients: { customer: string; name: string; phone: string | null }[];
    note: string;
  }>
> {
  return apiPost(METHODS.sendCampaign, { campaign });
}

export function saveCoupon(args: {
  coupon?: string;
  code?: string;
  name?: string;
  description?: string;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  maximumUse?: number;
  validFrom?: string | null;
  validUpto?: string | null;
}): Promise<Result<SrvCoupon>> {
  return apiPost<SrvCoupon>(METHODS.saveCoupon, args);
}

// ---------------------------------------------------------------------------
// Reservations & waitlist
// ---------------------------------------------------------------------------

export function saveReservation(args: {
  reservation?: string;
  guestName?: string;
  phone?: string;
  partySize?: number;
  reservedAt?: string;
  tableRef?: string | null;
  notes?: string;
}): Promise<Result<SrvReservation>> {
  return apiPost<SrvReservation>(METHODS.saveReservation, args);
}

/** Seating also opens the table, server-side — see api/reservations.py. */
export function setReservationStatus(args: {
  reservation: string;
  status: ReservationStatus;
  tableRef?: string;
  pax?: number;
}): Promise<Result<SrvReservation>> {
  return apiPost<SrvReservation>(METHODS.setReservationStatus, args);
}

export function addWalkin(args: {
  guestName: string;
  phone?: string;
  partySize?: number;
  quotedWaitMin?: number;
  notes?: string;
}): Promise<Result<SrvWaitlistEntry>> {
  return apiPost<SrvWaitlistEntry>(METHODS.addWalkin, args);
}

export function setWaitlistStatus(args: {
  entry: string;
  status: 'waiting' | 'seated' | 'left';
  tableRef?: string;
}): Promise<Result<SrvWaitlistEntry>> {
  return apiPost<SrvWaitlistEntry>(METHODS.setWaitlistStatus, args);
}

import type { PosInvoice, Station } from '@/types/domain';
import { PosInvoiceSchema } from '@/types/api';
import { apiGet, apiPost, unwrapOk } from './http';
import { METHODS } from './endpoints';
import { toPosInvoice } from './adapters';
import type { SrvInvoice } from '@/types/server';

export type InvoiceContext = { stationByCode: Map<string, Station>; openedAt?: string | null };

/**
 * Read a table's bill. A pure read, safe to refetch.
 *
 * It used to be a GET that also *created* the draft invoice, and that silently did
 * not work: Frappe commits a request only when the method is POST/PUT/DELETE/PATCH
 * and rolls back everything else (`frappe/app.py::sync_database`). The insert was
 * discarded at the end of the request while the response still carried the invoice
 * name built in memory — so the screen rendered a bill that did not exist and
 * payment failed with "Invoice … does not exist". Creating is now `openInvoice`.
 *
 * Throws a BusinessError with code `NO_INVOICE` when the table has an open order but
 * no bill yet. That is the cue to offer "Open bill", not a failure.
 */
export async function getInvoice(tableRef: string, ctx: InvoiceContext): Promise<PosInvoice> {
  const raw = await apiGet<SrvInvoice>(METHODS.getInvoice, { query: { table: tableRef } });
  // unwrapOk turns TABLE_NOT_FOUND / NO_OPEN_ORDER / NO_INVOICE into a thrown
  // BusinessError carrying `code`, so the screen can show the server's own wording.
  return PosInvoiceSchema.parse(toPosInvoice(unwrapOk(raw), ctx));
}

/**
 * Build the draft bill for a table and move it to `billing`.
 *
 * Idempotent server-side: a table that already has a live invoice gets that one back,
 * so a double-tap cannot open two bills against one table.
 */
export async function openInvoice(tableRef: string, ctx: InvoiceContext): Promise<PosInvoice> {
  const raw = await apiPost<SrvInvoice>(METHODS.openInvoice, { table: tableRef });
  return PosInvoiceSchema.parse(toPosInvoice(unwrapOk(raw), ctx));
}

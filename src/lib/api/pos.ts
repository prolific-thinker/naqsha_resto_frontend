import type { PosInvoice } from '@/types/domain';
import { PosInvoiceSchema } from '@/types/api';
import { mockGet } from './client';
import { httpGet, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
import { invoiceForTable } from '@/lib/mocks/bills';

export function getInvoice(tableRef: string): Promise<PosInvoice> {
  return USE_MOCKS
    ? mockGet(PosInvoiceSchema, invoiceForTable(tableRef))
    : httpGet(ENDPOINTS.invoice(tableRef), PosInvoiceSchema);
}

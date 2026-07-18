import type { PosInvoice } from '@/types/domain';
import { PosInvoiceSchema } from '@/types/api';
import { mockGet } from './client';
import { invoiceForTable } from '@/lib/mocks/bills';

export function getInvoice(tableRef: string): Promise<PosInvoice> {
  return mockGet(PosInvoiceSchema, invoiceForTable(tableRef));
}

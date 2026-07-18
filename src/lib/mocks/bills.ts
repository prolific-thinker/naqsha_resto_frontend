import type { PosInvoice } from '@/types/domain';
import { WAITERS } from './tables';

const INV_T07: PosInvoice = {
  ref: 'INV-C-2026-0231',
  tableRef: 'T-07',
  tableNumber: '07',
  pax: 6,
  waiter: WAITERS['W-02'] ?? { id: 'W-02', name: 'Bilal' },
  openedAtLabel: '18:44',
  durationLabel: '1h 26m',
  batches: [
    {
      label: null,
      lines: [
        { qty: 2, name: 'Chicken karahi', station: 'main', rate: 1180, amount: 2360 },
        { qty: 4, name: 'Naan', station: 'main', rate: 40, amount: 160 },
        { qty: 3, name: 'Beef bihari', station: 'bbq', rate: 1140, amount: 3420 },
        { qty: 6, name: 'Karak chai', station: 'drinks', rate: 250, amount: 1500 },
      ],
    },
    {
      label: 'batch 2 @ 19:22',
      lines: [
        { qty: 2, name: 'Malai boti', station: 'bbq', rate: 920, amount: 1840 },
        { qty: 2, name: 'Cappuccino', station: 'drinks', rate: 480, amount: 960 },
      ],
    },
    {
      label: 'batch 3 @ 19:58',
      lines: [{ qty: 1, name: 'Gulab jamun', station: 'main', rate: 340, amount: 340 }],
    },
  ],
  subtotalItems: 20,
  subtotal: 10580,
  serviceChargePct: 0,
  serviceCharge: 0,
  discount: -530,
  discountLabel: 'Discount (loyalty regular)',
  grandTotal: 10050,
};

export const INVOICES: Record<string, PosInvoice> = {
  'T-07': INV_T07,
};

/** Fallback so every /manager/pos/:tableId renders; real app opens the table's bill. */
export function invoiceForTable(tableRef: string): PosInvoice {
  return INVOICES[tableRef] ?? { ...INV_T07, tableRef, tableNumber: tableRef.replace(/^T-?/, '') };
}

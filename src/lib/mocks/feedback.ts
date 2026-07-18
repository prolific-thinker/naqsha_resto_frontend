import type { FeedbackContext } from '@/types/domain';

/** C-01 context resolved from the QR table slug. Dishes are what this table ate. */
export function feedbackContextForSlug(tableSlug: string): FeedbackContext {
  return {
    tableSlug,
    tableRef: 'T-02',
    invoiceRef: 'INV-C-2026-0234',
    branchLabel: 'Naqsha Cafe · Lahore',
    ownerFirstName: 'Zafar bhai',
    dishOptions: ['Chicken karahi', 'Karak chai', 'Naan', 'Beef bihari'],
  };
}

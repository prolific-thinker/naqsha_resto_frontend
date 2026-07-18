import type { Wastage, WastageItem } from '@/types/domain';

/** M-04 form default state — a spillage draft being recorded. */
export const WASTAGE_DRAFT_ITEMS: WastageItem[] = [
  { name: 'Chicken handi', code: 'FIN-CHK-HDI', qty: 2, uom: 'plate', rate: 380, amount: 760 },
  { name: 'Naan', code: 'FIN-NAN-01', qty: 1, uom: 'pc', rate: 28, amount: 28 },
];

export const WASTAGE_DRAFT = {
  ref: 'WST-C-2026-0018',
  reason: 'spillage' as const,
  note: 'Waiter dropped tray at kitchen door around 20:04. Two chicken handi and one naan.',
  items: WASTAGE_DRAFT_ITEMS,
  totalValue: 788,
};

/** O-02 approval queue — pending entries awaiting the owner's decision. */
export const WASTAGE_APPROVALS: Wastage[] = [
  {
    ref: 'WST-C-2026-0018',
    reason: 'spillage',
    reasonLabel: 'Spillage',
    note: 'Waiter dropped tray at kitchen door around 20:04. Two chicken handi and one naan.',
    items: [
      { name: 'Chicken handi', code: 'FIN-CHK-HDI', qty: 2, uom: 'plate', rate: 380, amount: 760 },
      { name: 'Naan', code: 'FIN-NAN-01', qty: 1, uom: 'pc', rate: 28, amount: 28 },
    ],
    totalValue: 788,
    managerLabel: 'Bilal (M-01)',
    reportedAtLabel: 'Today · 20:14',
    evidenceCount: 1,
    status: 'pending',
    tag: { label: 'high value', tone: 'alert' },
  },
  {
    ref: 'WST-C-2026-0017',
    reason: 'refused',
    reasonLabel: 'Customer refused',
    note: 'Customer at T-04 said the karahi was too spicy. Table remade at their cost, this entry covers the original portion.',
    items: [{ name: 'Chicken karahi', code: 'FIN-CHK-KAR', qty: 1, uom: 'plate', rate: 340, amount: 340 }],
    totalValue: 340,
    managerLabel: 'Bilal (M-01)',
    reportedAtLabel: 'Today · 19:32',
    evidenceCount: 0,
    status: 'pending',
    tag: { label: 'customer', tone: 'muted' },
  },
  {
    ref: 'WST-C-2026-0016',
    reason: 'expired',
    reasonLabel: 'Expired ingredient',
    note: 'Cream cheese used for cheesecake base — 400g pack expired end of shift. Discarded per hygiene SOP.',
    items: [{ name: 'Cream cheese', code: 'RAW-CRM-CHS', qty: 0.4, uom: 'kg', rate: 280, amount: 112 }],
    totalValue: 112,
    managerLabel: 'Bilal (M-01)',
    reportedAtLabel: 'Yesterday · 22:04',
    evidenceCount: 1,
    status: 'pending',
    tag: { label: 'routine', tone: 'amber' },
  },
];

export const WASTAGE_COUNTS = { pending: 3, approved: 12, rejected: 1 };

export const WASTAGE_WEEK = {
  rangeLabel: 'Mon 14 – Sun 20 Jul',
  approvedValue: 4420,
  pendingValue: 1240,
};

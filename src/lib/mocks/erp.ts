/**
 * In-memory sample data for the ERP screens that are still v1.1: menu admin,
 * marketing (campaigns / coupons) and reservations / waitlist.
 *
 * Inventory, purchasing, CRM, reports and staff used to live here too. They are wired
 * to `naqsha_pos.api.*` now, and their fixtures were DELETED rather than left behind —
 * a second copy of the same data that no longer has to compile against the live shape
 * is how a mock quietly stops resembling the thing it stands in for.
 */
import type {
  MenuAdminItem,
  Combo,
  TimedMenu,
} from '@/types/erp';

// ---- Menu admin -----------------------------------------------------------

export const MENU_ADMIN_ITEMS: MenuAdminItem[] = [
  { code: 'FIN-CHK-KAR', name: 'Chicken karahi', categoryId: 'main', categoryName: 'Main course', station: 'main', price: 1180, cost: 512, is86: false, availableQty: 24 },
  { code: 'FIN-CHK-HDI', name: 'Chicken handi', categoryId: 'main', categoryName: 'Main course', station: 'main', price: 980, cost: 430, is86: false, availableQty: 18 },
  { code: 'FIN-BBQ-TKA', name: 'Chicken tikka', categoryId: 'bbq', categoryName: 'BBQ & grill', station: 'bbq', price: 640, cost: 280, is86: false, availableQty: 40 },
  { code: 'FIN-BBQ-SEK', name: 'Seekh kabab', categoryId: 'bbq', categoryName: 'BBQ & grill', station: 'bbq', price: 520, cost: 240, is86: true, outOfStockReason: 'Mince finished', availableQty: 0 },
  { code: 'FIN-CHA-KRK', name: 'Karak chai', categoryId: 'drinks', categoryName: 'Drinks & coffee', station: 'drinks', price: 180, cost: 42, is86: false, availableQty: 200 },
  { code: 'FIN-COF-CAP', name: 'Cappuccino', categoryId: 'drinks', categoryName: 'Drinks & coffee', station: 'drinks', price: 420, cost: 120, is86: false, availableQty: 120 },
  { code: 'FIN-BRD-NAN', name: 'Naan', categoryId: 'main', categoryName: 'Main course', station: 'main', price: 40, cost: 12, is86: false, availableQty: 300 },
  { code: 'FIN-DES-KHR', name: 'Kheer', categoryId: 'dessert', categoryName: 'Dessert', station: 'main', price: 260, cost: 90, is86: false, availableQty: 15 },
];

export const COMBOS: Combo[] = [
  {
    code: 'CMB-BBQ-2',
    name: 'BBQ platter for 2',
    price: 1980,
    savingLabel: 'save ₨ 180',
    components: [
      { name: 'Chicken tikka', qty: 2 },
      { name: 'Seekh kabab', qty: 2 },
      { name: 'Naan', qty: 4 },
      { name: 'Karak chai', qty: 2 },
    ],
  },
  {
    code: 'CMB-DEAL-1',
    name: 'Solo lunch deal',
    price: 780,
    savingLabel: 'save ₨ 120',
    components: [
      { name: 'Chicken handi (half)', qty: 1 },
      { name: 'Naan', qty: 2 },
      { name: 'Soft drink', qty: 1 },
    ],
  },
];

export const TIMED_MENUS: TimedMenu[] = [
  { id: 'TM-BRK', name: 'Breakfast', priceListLabel: 'Breakfast Price List', windowLabel: '08:00 – 11:30 · daily', itemsCount: 12, active: true },
  { id: 'TM-HH', name: 'Happy hour', priceListLabel: 'Happy Hour Price List', windowLabel: '16:00 – 18:00 · Mon–Thu', itemsCount: 8, active: true },
  { id: 'TM-LATE', name: 'Late night', priceListLabel: 'Late Night Price List', windowLabel: '23:00 – 02:00 · Fri–Sat', itemsCount: 15, active: false },
];
export const LOYALTY_PROGRAM = {
  name: 'Naqsha Rewards',
  conversionLabel: '1 point per ₨ 100 spent · 100 points = ₨ 100 off',
  tierLabel: 'Silver → Gold at 1,000 pts · Gold → Platinum at 5,000 pts',
};


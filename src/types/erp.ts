/**
 * Domain types for the ERPNext-backed feature set (menu admin, inventory,
 * purchasing, checkout/tax, CRM/loyalty/marketing, online/delivery,
 * reservations, reporting, staff/HR). These mirror the shape of the real
 * Frappe/ERPNext DocType JSON the backend will return — see
 * docs/BACKEND_DOCTYPE_REQUIREMENTS.md. Components/hooks depend only on these;
 * src/lib/api/* is the single swap point (mock ↔ /api/resource).
 *
 * Kept separate from domain.ts (the original operations-loop model) to isolate
 * the new surface; same ground-truth role.
 */
import type { Station, ChipTone, MopKind } from './domain';

// ---- Menu administration (N-1..N-4) ---------------------------------------

export type MenuAdminItem = {
  code: string; // Item.item_code — "FIN-CHK-KAR"
  name: string;
  categoryId: string; // Item Group
  categoryName: string;
  station: Station; // custom field restaurant_station
  price: number; // Item Price.price_list_rate
  cost?: number; // valuation / BOM cost
  is86: boolean; // custom field is_86
  outOfStockReason?: string;
  availableQty?: number; // from Bin, when stock-tracked
};

export type ComboItem = { name: string; qty: number };

export type Combo = {
  code: string; // Product Bundle.new_item_code
  name: string;
  price: number;
  savingLabel?: string; // "save ₨ 120"
  components: ComboItem[];
};

export type TimedMenu = {
  id: string;
  name: string; // "Breakfast", "Happy hour"
  priceListLabel: string; // Price List name
  windowLabel: string; // "08:00 – 11:30 · daily"
  itemsCount: number;
  active: boolean;
};

// ---- Inventory & supply (I-1..I-3) ----------------------------------------

export type StockStatus = 'ok' | 'low' | 'out';

export type StockRow = {
  code: string; // Item.item_code
  name: string;
  warehouse: string;
  actualQty: number; // Bin.actual_qty
  uom: string;
  reorderLevel: number;
  valuationRate: number;
  status: StockStatus;
};

export type BomLine = { name: string; qty: number; uom: string; rate: number; amount: number };

export type Bom = {
  id: string; // BOM name
  itemName: string;
  itemCode: string;
  /** Portions the underlying BOM batch yields. Every figure below is PER PORTION. */
  portions: number;
  sellPrice: number;
  totalCost: number; // per portion
  foodCostPct: number; // totalCost / sellPrice
  lines: BomLine[];
};

export type CogsCategory = { category: string; cost: number; pct: number };

export type CogsSummary = {
  periodLabel: string;
  revenue: number;
  cogs: number;
  foodCostPct: number;
  grossProfit: number;
  /** Revenue from items with neither a valuation nor a recipe, so the food-cost
   *  figure can be shown with the confidence it actually deserves. */
  uncostedRevenue?: number;
  byCategory: CogsCategory[];
};

// ---- Purchasing (I-4, I-5) ------------------------------------------------

export type PoStatus = 'draft' | 'to_receive' | 'completed' | 'cancelled';

export type PurchaseLine = { name: string; qty: number; uom: string; rate: number; amount: number };

export type PurchaseOrder = {
  ref: string; // "PUR-ORD-2026-0042"
  supplier: string;
  status: PoStatus;
  statusLabel: string;
  dateLabel: string;
  scheduleLabel: string;
  total: number;
  receivedPct: number;
  lines: PurchaseLine[];
};

export type Supplier = {
  id: string;
  name: string;
  group: string; // Supplier Group
  phone: string;
  city?: string;
  outstanding: number; // payable
};

// ---- Checkout / payments / tax (B-1..B-4, TAX-1..3) -----------------------

export type TenderKind = MopKind | 'jazzcash' | 'easypaisa';

export type PaymentModeOption = { key: TenderKind; label: string; kind: MopKind };

export type TenderLine = { key: TenderKind; label: string; amount: number; reference?: string };

export type TaxLine = { label: string; rate: number; amount: number };

export type FiscalReceipt = {
  invoiceRef: string;
  fbrInvoiceNumber: string; // TAX-1
  fbrPosId: string;
  fiscalQrData: string; // TAX-3 — QR payload
  province: string; // TAX-2
  taxes: TaxLine[];
};

// ---- CRM / loyalty / marketing (G-1..G-4) ---------------------------------

export type CustomerVisit = { invoiceRef: string; dateLabel: string; amount: number; itemsLabel: string };

export type Customer = {
  id: string; // Customer.name
  name: string;
  phone: string;
  group: string; // Customer Group
  sinceLabel: string;
  visits: number;
  totalSpend: number;
  loyaltyPoints: number;
  tags: string[];
  history?: CustomerVisit[];
};

export type CampaignChannel = 'whatsapp' | 'sms' | 'email';
export type CampaignAudience = 'all' | 'loyalty' | 'lapsed_30' | 'lapsed_90' | 'recent_30';

export type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  audience: CampaignAudience;
  /** "Lapsed > 30 days (86)" — the segment and its live count. */
  audienceLabel: string;
  reach: number;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledLabel: string;
  scheduledAt?: string;
};

export type Coupon = {
  /** The `Coupon Code` document name. `code` is what the guest actually types. */
  ref: string;
  code: string;
  name: string;
  description: string;
  discountLabel: string; // "15% off" | "₨ 200 off"
  used: number;
  limit: number;
  validUptoLabel: string;
  validUpto?: string;
  status: 'active' | 'expired' | 'used_up' | 'scheduled';
};

// ---- Reservations & waitlist (RES-1, RES-2) -------------------------------

export type ReservationStatus = 'booked' | 'seated' | 'cancelled' | 'no_show';

export type Reservation = {
  ref: string;
  guestName: string;
  phone: string;
  customer?: string;
  tableRef?: string;
  /** Raw ISO, so the form can edit it without reparsing the label. */
  reservedAt: string;
  reservedAtLabel: string; // "Today · 20:30"
  partySize: number;
  status: ReservationStatus;
  notes?: string;
};

export type WaitlistEntry = {
  ref: string;
  guestName: string;
  phone: string;
  partySize: number;
  quotedWaitMin: number;
  status: 'waiting' | 'seated' | 'left';
  joinedAt: string;
  joinedLabel: string;
  tableRef?: string;
  /** Minutes actually waited so far — compared against `quotedWaitMin`. */
  waitingMin: number;
};

// ---- Reporting & analytics (O-3..O-5) -------------------------------------

export type ReportPnlLine = {
  label: string;
  /** Signed contribution to net profit: revenue positive, costs negative. A cost line
   *  with a POSITIVE value is a credit — an inventory write-up, a returned purchase —
   *  and the screen must show the sign rather than let it read as a cost. */
  value: number;
  pct: string;
  /** 0 = total, 1 = a component of the total above it. */
  indent: number;
};

export type SalesTrendPoint = { label: string; revenue: number };

export type PnlReport = {
  periodLabel: string;
  netProfit: number;
  /** Against the same-length window immediately before. */
  deltaLabel: string;
  deltaTone: 'up' | 'down' | 'muted';
  lines: ReportPnlLine[];
  trend: SalesTrendPoint[];
};

export type ItemPerfRow = {
  rank: number;
  name: string;
  category: string;
  qty: number;
  revenue: number;
  sharePct: number;
};

export type BranchRow = {
  branch: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  deltaLabel: string;
  deltaTone: 'up' | 'down' | 'muted';
};

// ---- Staff / HR / payroll (S-2..S-5) --------------------------------------

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave';

export type AttendanceRow = {
  /** Employee id — the React key. `employee` is the display name and can collide. */
  id: string;
  employee: string;
  role: string;
  status: AttendanceStatus;
  inLabel?: string;
  outLabel?: string;
  /** True when the row came from a clock-button checkin rather than an HRMS
   *  Attendance record. */
  derived?: boolean;
};

export type StaffPerfRow = {
  rank: number;
  name: string;
  role: string;
  orders: number;
  sales: number;
  avgTicket: number;
};

export type ShiftRow = {
  /** Shift Assignment name — the React key. */
  id: string;
  employee: string;
  shiftType: string; // Shift Type
  timeLabel: string; // "18:00 – 02:00"
  daysLabel: string; // "Mon–Sat"
};

export type PayrollRow = {
  /** Salary Slip name — the React key. */
  id: string;
  employee: string;
  role: string;
  gross: number;
  deductions: number;
  net: number;
  status: 'draft' | 'submitted' | 'paid';
};

export type PayrollSummary = {
  periodLabel: string;
  totalNet: number;
  headcount: number;
  rows: PayrollRow[];
};

// ---- Shared display helper ------------------------------------------------

/** Small status chip descriptor used across the ERP screens. */
export type StatusTag = { label: string; tone: ChipTone };

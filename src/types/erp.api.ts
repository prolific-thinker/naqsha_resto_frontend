/**
 * Zod schemas for the ERPNext-backed feature set — the runtime validation
 * boundary for everything in src/lib/api/* that touches these domains. Shapes
 * are authored so z.infer matches src/types/erp.ts. Mirrors types/api.ts.
 */
import { z } from 'zod';
import { StationSchema, ChipToneSchema } from './api';

// ---- Menu admin -----------------------------------------------------------

export const MenuAdminItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  station: StationSchema,
  price: z.number(),
  cost: z.number().optional(),
  is86: z.boolean(),
  outOfStockReason: z.string().optional(),
  availableQty: z.number().optional(),
});

export const ComboSchema = z.object({
  code: z.string(),
  name: z.string(),
  price: z.number(),
  savingLabel: z.string().optional(),
  components: z.array(z.object({ name: z.string(), qty: z.number() })),
});

export const TimedMenuSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceListLabel: z.string(),
  windowLabel: z.string(),
  itemsCount: z.number(),
  active: z.boolean(),
});

// ---- Inventory ------------------------------------------------------------

export const StockRowSchema = z.object({
  code: z.string(),
  name: z.string(),
  warehouse: z.string(),
  actualQty: z.number(),
  uom: z.string(),
  reorderLevel: z.number(),
  valuationRate: z.number(),
  status: z.enum(['ok', 'low', 'out']),
});

export const BomSchema = z.object({
  id: z.string(),
  itemName: z.string(),
  itemCode: z.string(),
  portions: z.number(),
  sellPrice: z.number(),
  totalCost: z.number(),
  foodCostPct: z.number(),
  lines: z.array(
    z.object({ name: z.string(), qty: z.number(), uom: z.string(), rate: z.number(), amount: z.number() }),
  ),
});

export const CogsSummarySchema = z.object({
  periodLabel: z.string(),
  revenue: z.number(),
  cogs: z.number(),
  foodCostPct: z.number(),
  grossProfit: z.number(),
  uncostedRevenue: z.number().optional(),
  byCategory: z.array(z.object({ category: z.string(), cost: z.number(), pct: z.number() })),
});

// ---- Purchasing -----------------------------------------------------------

export const PurchaseOrderSchema = z.object({
  ref: z.string(),
  supplier: z.string(),
  status: z.enum(['draft', 'to_receive', 'completed', 'cancelled']),
  statusLabel: z.string(),
  dateLabel: z.string(),
  scheduleLabel: z.string(),
  total: z.number(),
  receivedPct: z.number(),
  lines: z.array(
    z.object({ name: z.string(), qty: z.number(), uom: z.string(), rate: z.number(), amount: z.number() }),
  ),
});

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string(),
  phone: z.string(),
  city: z.string().optional(),
  outstanding: z.number(),
});

// ---- Checkout / tax -------------------------------------------------------

export const FiscalReceiptSchema = z.object({
  invoiceRef: z.string(),
  fbrInvoiceNumber: z.string(),
  fbrPosId: z.string(),
  fiscalQrData: z.string(),
  province: z.string(),
  taxes: z.array(z.object({ label: z.string(), rate: z.number(), amount: z.number() })),
});

// ---- CRM / loyalty / marketing --------------------------------------------

export const CustomerVisitSchema = z.object({
  invoiceRef: z.string(),
  dateLabel: z.string(),
  amount: z.number(),
  itemsLabel: z.string(),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  group: z.string(),
  sinceLabel: z.string(),
  visits: z.number(),
  totalSpend: z.number(),
  loyaltyPoints: z.number(),
  tags: z.array(z.string()),
  /** Fetched separately by `crm.customer_history`. Joining every invoice line for
   *  every customer to render a list nobody has clicked into is how a CRM screen
   *  gets slow on the day the book gets big. */
  history: z.array(CustomerVisitSchema).optional(),
});

export const CampaignAudienceSchema = z.enum([
  'all',
  'loyalty',
  'lapsed_30',
  'lapsed_90',
  'recent_30',
]);

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  audience: CampaignAudienceSchema,
  audienceLabel: z.string(),
  reach: z.number(),
  status: z.enum(['draft', 'scheduled', 'sent']),
  scheduledLabel: z.string(),
  scheduledAt: z.string().optional(),
});

export const CouponSchema = z.object({
  ref: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  discountLabel: z.string(),
  used: z.number(),
  limit: z.number(),
  validUptoLabel: z.string(),
  validUpto: z.string().optional(),
  // `scheduled` is a real state: a coupon whose valid_from is still ahead exists but
  // cannot be redeemed yet, and calling that "active" is how staff hand out a code
  // that bounces at the till.
  status: z.enum(['active', 'expired', 'used_up', 'scheduled']),
});

// ---- Reservations / waitlist ----------------------------------------------

export const ReservationSchema = z.object({
  ref: z.string(),
  guestName: z.string(),
  phone: z.string(),
  customer: z.string().optional(),
  tableRef: z.string().optional(),
  reservedAt: z.string(),
  reservedAtLabel: z.string(),
  partySize: z.number(),
  status: z.enum(['booked', 'seated', 'cancelled', 'no_show']),
  notes: z.string().optional(),
});

export const WaitlistEntrySchema = z.object({
  ref: z.string(),
  guestName: z.string(),
  phone: z.string(),
  partySize: z.number(),
  quotedWaitMin: z.number(),
  status: z.enum(['waiting', 'seated', 'left']),
  joinedAt: z.string(),
  joinedLabel: z.string(),
  tableRef: z.string().optional(),
  /** Minutes since they joined — the number that decides who is seated next. */
  waitingMin: z.number(),
});

// ---- Reporting ------------------------------------------------------------

export const PnlReportSchema = z.object({
  periodLabel: z.string(),
  netProfit: z.number(),
  deltaLabel: z.string(),
  deltaTone: z.enum(['up', 'down', 'muted']),
  lines: z.array(z.object({ label: z.string(), value: z.number(), pct: z.string(), indent: z.number() })),
  trend: z.array(z.object({ label: z.string(), revenue: z.number() })),
});

export const ItemPerfRowSchema = z.object({
  rank: z.number(),
  name: z.string(),
  category: z.string(),
  qty: z.number(),
  revenue: z.number(),
  sharePct: z.number(),
});

export const BranchRowSchema = z.object({
  branch: z.string(),
  revenue: z.number(),
  orders: z.number(),
  avgTicket: z.number(),
  deltaLabel: z.string(),
  deltaTone: z.enum(['up', 'down', 'muted']),
});

// ---- Staff / HR / payroll -------------------------------------------------

export const AttendanceRowSchema = z.object({
  id: z.string(),
  employee: z.string(),
  role: z.string(),
  status: z.enum(['present', 'absent', 'half_day', 'on_leave']),
  inLabel: z.string().optional(),
  outLabel: z.string().optional(),
  derived: z.boolean().optional(),
});

export const StaffPerfRowSchema = z.object({
  rank: z.number(),
  name: z.string(),
  role: z.string(),
  orders: z.number(),
  sales: z.number(),
  avgTicket: z.number(),
});

export const ShiftRowSchema = z.object({
  id: z.string(),
  employee: z.string(),
  shiftType: z.string(),
  timeLabel: z.string(),
  daysLabel: z.string(),
});

export const PayrollSummarySchema = z.object({
  periodLabel: z.string(),
  totalNet: z.number(),
  headcount: z.number(),
  rows: z.array(
    z.object({
      id: z.string(),
      employee: z.string(),
      role: z.string(),
      gross: z.number(),
      deductions: z.number(),
      net: z.number(),
      status: z.enum(['draft', 'submitted', 'paid']),
    }),
  ),
});

export const StatusTagSchema = z.object({ label: z.string(), tone: ChipToneSchema });

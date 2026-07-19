/**
 * Zod schemas — the runtime validation boundary. Every value returned through
 * lib/api/* is parsed by one of these before it reaches a hook (handover §8).
 * Schemas are structured so z.infer matches the domain types in domain.ts.
 */
import { z } from 'zod';

export const StationSchema = z.enum(['drinks', 'main', 'bbq']);
export const KotStateSchema = z.enum(['queued', 'preparing', 'breach', 'prepared']);
export const TableStateSchema = z.enum([
  'free',
  'mine',
  'occupied',
  'active',
  'breach',
  'ready',
  'feedback',
  'billing',
]);
export const ChipToneSchema = z.enum(['teal', 'amber', 'success', 'alert', 'muted', 'ink']);

export const WaiterSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
  station: StationSchema,
});

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  station: StationSchema,
  categoryId: z.string(),
  outOfStock: z.boolean().optional(),
  outOfStockReason: z.string().optional(),
});

const KotProgressSchema = z.enum(['pending', 'prep', 'done']);

export const TableSchema = z.object({
  ref: z.string(),
  number: z.string(),
  state: TableStateSchema,
  seats: z.number().optional(),
  waiter: WaiterSchema.optional(),
  meta: z.string().optional(),
  pax: z.number().optional(),
  amount: z.number().optional(),
  openedAtLabel: z.string().optional(),
  kots: z.array(KotProgressSchema).optional(),
  actionTag: z.string().optional(),
  statusTag: z.object({ label: z.string(), tone: ChipToneSchema }).optional(),
});

export const TakeawayOrderSchema = z.object({ ref: z.string() });

export const KotItemSchema = z.object({
  name: z.string(),
  qty: z.number(),
  comment: z.string().optional(),
});

export const KotSchema = z.object({
  ref: z.string(),
  station: StationSchema,
  tableRef: z.string(),
  items: z.array(KotItemSchema),
  state: KotStateSchema,
  waitSeconds: z.number().optional(),
  elapsedSeconds: z.number().optional(),
  slaSeconds: z.number(),
  doneSeconds: z.number().optional(),
  onTime: z.boolean().optional(),
});

export const StationMetaSchema = z.object({
  station: StationSchema,
  name: z.string(),
  stationId: z.string(),
  slaSeconds: z.number(),
  activeMax: z.number(),
  avgPrepLabel: z.string(),
  slaCompliancePct: z.number(),
  totalPrepared: z.number(),
});

export const KdsBoardSchema = z.object({
  meta: StationMetaSchema,
  queue: z.array(KotSchema),
  active: z.array(KotSchema),
  prepared: z.array(KotSchema),
});

export const StationLineSchema = z.object({
  station: StationSchema,
  items: z.string(),
  status: z.enum(['queued', 'prep', 'ready', 'none']),
  statusLabel: z.string(),
  overSla: z.boolean().optional(),
});

export const AggregateRowSchema = z.object({
  tableRef: z.string(),
  tableNumber: z.string(),
  rowState: z.enum(['ready', 'breach', 'normal']),
  stations: z.array(StationLineSchema),
  action: z.object({
    kind: z.enum(['dispatch', 'escalate', 'waiting']),
    label: z.string(),
    hint: z.string(),
  }),
});

export const BillLineSchema = z.object({
  qty: z.number(),
  name: z.string(),
  station: StationSchema,
  rate: z.number(),
  amount: z.number(),
});

export const OrderBatchSchema = z.object({
  label: z.string().nullable(),
  lines: z.array(BillLineSchema),
});

export const PosInvoiceSchema = z.object({
  ref: z.string(),
  tableRef: z.string(),
  tableNumber: z.string(),
  pax: z.number(),
  waiter: WaiterSchema,
  openedAtLabel: z.string(),
  durationLabel: z.string(),
  batches: z.array(OrderBatchSchema),
  subtotalItems: z.number(),
  subtotal: z.number(),
  serviceChargePct: z.number(),
  serviceCharge: z.number(),
  discount: z.number().optional(),
  discountLabel: z.string().optional(),
  grandTotal: z.number(),
});

export const WastageItemSchema = z.object({
  name: z.string(),
  code: z.string(),
  qty: z.number(),
  uom: z.string(),
  rate: z.number(),
  amount: z.number(),
});

export const WastageSchema = z.object({
  ref: z.string(),
  reason: z.enum(['spillage', 'refused', 'cook_error', 'expired', 'other']),
  reasonLabel: z.string(),
  note: z.string().optional(),
  items: z.array(WastageItemSchema),
  totalValue: z.number(),
  managerLabel: z.string(),
  reportedAtLabel: z.string(),
  evidenceCount: z.number(),
  status: z.enum(['pending', 'approved', 'rejected']),
  tag: z.object({ label: z.string(), tone: ChipToneSchema }).optional(),
});

export const WastageCountsSchema = z.object({
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
});

export const WastageWeekSchema = z.object({
  rangeLabel: z.string(),
  approvedValue: z.number(),
  pendingValue: z.number(),
});

export const FeedbackContextSchema = z.object({
  tableSlug: z.string(),
  tableRef: z.string(),
  invoiceRef: z.string(),
  branchLabel: z.string(),
  ownerFirstName: z.string(),
  dishOptions: z.array(z.string()),
});

const PnlLineSchema = z.object({
  label: z.string(),
  value: z.number(),
  pct: z.string(),
});

const MiniStatSchema = z.object({
  label: z.string(),
  value: z.string(),
  delta: z.string(),
  deltaTone: z.enum(['up', 'down', 'muted']),
  aux: z.string(),
});

const HourBarSchema = z.object({
  hour: z.string(),
  pct: z.number(),
  peak: z.boolean().optional(),
});

const DishRankSchema = z.object({
  rank: z.number(),
  name: z.string(),
  category: z.string(),
  count: z.number(),
  revenue: z.number(),
});

export const OwnerDashboardSchema = z.object({
  greet: z.string(),
  ownerName: z.string(),
  lead: z.string(),
  pnl: z.object({
    netProfit: z.number(),
    periodLabel: z.string(),
    deltaLabel: z.string(),
    lines: z.array(PnlLineSchema),
  }),
  miniStats: z.array(MiniStatSchema),
  revenueByHour: z.array(HourBarSchema),
  peakNote: z.string(),
  bestDishes: z.array(DishRankSchema),
  bottomNote: z.string(),
});

// Request payloads
export const FeedbackSubmissionSchema = z.object({
  tableSlug: z.string(),
  rating: z.number().min(1).max(5),
  likedDishes: z.array(z.string()),
  comment: z.string().optional(),
  phone: z.string().optional(),
});

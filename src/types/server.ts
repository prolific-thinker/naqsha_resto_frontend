/**
 * Raw payload shapes returned by naqsha_pos.api.* — the wire contract, exactly as
 * NAQSHA_API_CONTRACT.md defines it. These are NOT the app's view models; the
 * adapters in src/lib/api/adapters/ map these onto the Zod schemas in types/api.ts.
 *
 * Deliberately hand-written TS, not Zod. A second schema layer here would double the
 * surface to maintain and only move a contract drift's failure a few microseconds
 * earlier — the view-model schemas already fail loudly at the same boundary.
 *
 * `| null` is written out everywhere the server can send it. Frappe serialises empty
 * fields as JSON null, and Zod's `.optional()` accepts `undefined` but REJECTS `null`,
 * so every optional mapping has to go through `opt()` in adapters/shared.ts.
 */

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------

export type SrvSession = {
  user: string;
  fullName: string;
  employee: string | null;
  roles: string[];
  primaryRole: 'waiter' | 'kitchen' | 'manager' | 'owner' | null;
  branch: string | null;
  branchAbbr: string | null;
  csrfToken: string | null;
  canAccessDesk: boolean;
};

// ---------------------------------------------------------------------------
// floor
// ---------------------------------------------------------------------------

export type SrvTableKot = {
  ref: string;
  station: string;
  state: 'queued' | 'preparing' | 'breach' | 'prepared' | 'voided';
};

export type SrvTable = {
  ref: string;
  number: string;
  state: 'free' | 'occupied' | 'active' | 'breach' | 'ready' | 'billing' | 'feedback';
  seats: number | null;
  activePax: number;
  /** employee_name, a plain string — NOT the {id,name} object the view model wants. */
  waiter: string | null;
  isMine: boolean;
  runningAmount: number;
  openedAt: string | null;
  activeOrder: string | null;
  activeInvoice: string | null;
  slug: string | null;
  kots: SrvTableKot[];
};

export type SrvTableAction = {
  ok: boolean;
  code?: string;
  message?: string;
  table?: string;
  state?: string;
};

// ---------------------------------------------------------------------------
// menu
// ---------------------------------------------------------------------------

export type SrvCategory = {
  id: string;
  name: string;
  count: number;
  /** Item Group.restaurant_station is an optional custom field, so this can be null. */
  station: string | null;
};

export type SrvMenuItem = {
  code: string;
  name: string;
  description: string | null;
  image: string | null;
  category: string;
  price: number;
  station: string | null;
  prepTimeSeconds: number;
  is86: boolean;
  outOfStockReason: string | null;
  defaultCourse: string | null;
  hasVariants: boolean;
  isBundle: boolean;
};

// ---------------------------------------------------------------------------
// ordering
// ---------------------------------------------------------------------------

export type SrvOrderLine = {
  code: string;
  qty: number;
  comment?: string | null;
  course?: string | null;
  seat?: number | null;
};

export type SrvOrderResult = {
  ok: true;
  order: string;
  kots: { ref: string; station: string; slaSeconds: number }[];
  tableState: string | null;
  replayed?: boolean;
};

// ---------------------------------------------------------------------------
// kds
// ---------------------------------------------------------------------------

export type SrvKotItem = {
  item: string;
  /** Note: `itemName`, where the view model's field is `name`. */
  itemName: string | null;
  qty: number;
  comment: string | null;
  course: string | null;
  seat: number | null;
};

export type SrvKot = {
  ref: string;
  station: string;
  tableRef: string | null;
  tableNumber: string | null;
  orderRef: string | null;
  state: 'queued' | 'preparing' | 'breach' | 'prepared';
  slaSeconds: number;
  /** startedAt ?? queuedAt. The KDS timers count up from this. */
  receivedAt: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  preparedAt: string | null;
  onTime: boolean | null;
  items: SrvKotItem[];
};

export type SrvStationMeta = {
  stationId: string;
  stationName: string;
  stationKey: string;
  slaSeconds: number;
  activeMax: number;
  /** Formatted "4m 22s" — the UI wants "04:22", so the adapter reparses it. */
  avgPrepLabel: string;
  slaCompliancePct: number;
  totalPrepared: number;
};

export type SrvKdsBoard = {
  meta: SrvStationMeta;
  queue: SrvKot[];
  active: SrvKot[];
  prepared: SrvKot[];
};

export type SrvAggregateRow = {
  tableRef: string;
  tableNumber: string | null;
  waiter: string | null;
  readyCount: number;
  totalCount: number;
  worstState: 'queued' | 'preparing' | 'breach' | 'prepared';
  oldestReceivedAt: string | null;
  /** One entry per KOT, so a station can repeat or be absent entirely. */
  stations: { station: string; state: string }[];
};

export type SrvAdvanceResult = {
  ok: boolean;
  code?: string;
  message?: string;
  kot?: string;
  state?: string;
  startedAt?: string | null;
  preparedAt?: string | null;
  onTime?: boolean | null;
  tableState?: string | null;
};

// ---------------------------------------------------------------------------
// billing
// ---------------------------------------------------------------------------

export type SrvBillLine = {
  code: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
  comment: string | null;
};

export type SrvBatch = {
  label: string | null;
  firedAt: string | null;
  lines: SrvBillLine[];
};

export type SrvInvoice = {
  ref: string;
  tableRef: string | null;
  tableNumber: string | null;
  waiter: string | null;
  pax: number;
  docstatus: 0 | 1 | 2;
  batches: SrvBatch[];
  subtotal: number;
  discountAmount: number;
  couponRef: string | null;
  couponCode: string | null;
  serviceChargePct: number;
  serviceChargeAmount: number;
  taxes: { description: string; rate: number; amount: number }[];
  grandTotal: number;
  roundedTotal: number;
  paidAmount: number;
  changeAmount: number;
  payments: { mode: string; amount: number; reference: string | null }[];
  /** The site's real Mode of Payment names. Sending anything else is BAD_MODE_OF_PAYMENT. */
  modesOfPayment: string[];
};

export type SrvPaymentResult = {
  ok: true;
  invoice: string;
  docstatus: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  loyaltyEarned: number;
  tableState: string | null;
  replayed?: boolean;
};

// ---------------------------------------------------------------------------
// wastage / owner / guest
// ---------------------------------------------------------------------------

export type SrvWastageCounts = {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
};

export type SrvWastageSummary = {
  range: string;
  totalValue: number;
  entryCount: number;
  topReason: string | null;
  byDay: { date: string; value: number }[];
};

export type SrvOwnerDashboard = {
  period: string;
  fromDate: string;
  toDate: string;
  generatedAt: string;
  miniStats: {
    netSales: number;
    orderCount: number;
    avgTicket: number;
    covers: number;
    foodCostPct: number;
    wastageValue: number;
  };
  /** The same-length window immediately before, for a real period-over-period delta. */
  previous: {
    fromDate: string;
    toDate: string;
    netSales: number;
    orderCount: number;
    avgTicket: number;
  };
  pnl: { label: string; amount: number; indent: number }[];
  revenueByHour: { hour: string; amount: number }[];
  bestDishes: { code: string; name: string; category: string; qty: number; amount: number }[];
};

export type SrvGuestMenu = {
  branchLabel: string | null;
  tableNumber: string;
  tableSlug: string;
  categories: { id: string; name: string; count: number }[];
  items: SrvMenuItem[];
};

export type SrvFeedbackContext = {
  branchLabel: string | null;
  tableNumber: string;
  tableSlug: string;
  invoiceRef: string | null;
  dishOptions: { code: string; name: string }[];
};

// ---------------------------------------------------------------------------
// inventory
// ---------------------------------------------------------------------------

export type SrvStockRow = {
  itemCode: string;
  itemName: string;
  itemGroup: string | null;
  warehouse: string;
  actualQty: number;
  uom: string | null;
  reorderLevel: number;
  isLow: boolean;
  isOut: boolean;
  is86: boolean;
  valuationRate: number;
};

export type SrvBomLine = {
  itemCode: string;
  itemName: string | null;
  qty: number;
  uom: string | null;
  rate: number;
  amount: number;
};

export type SrvBom = {
  bom: string;
  itemCode: string;
  itemName: string | null;
  /** Batch size. `unitCost` is already divided by it; `totalCost` is not. */
  quantity: number;
  unitCost: number;
  totalCost: number;
  sellPrice: number;
  foodCostPct: number;
  lines: SrvBomLine[];
};

export type SrvCogs = {
  period: string;
  fromDate: string;
  toDate: string;
  revenue: number;
  cogs: number;
  foodCostPct: number;
  grossProfit: number;
  /** Revenue from lines with neither a valuation nor a BOM. Honest, not hidden. */
  uncostedRevenue: number;
  byCategory: { category: string; cost: number; revenue: number; pct: number }[];
};

// ---------------------------------------------------------------------------
// purchasing
// ---------------------------------------------------------------------------

export type SrvPurchaseLine = {
  itemCode: string;
  itemName: string | null;
  qty: number;
  receivedQty: number;
  uom: string | null;
  rate: number;
  amount: number;
};

export type SrvPurchaseOrder = {
  ref: string;
  supplier: string;
  supplierName: string;
  status: 'draft' | 'to_receive' | 'completed' | 'cancelled';
  statusLabel: string;
  date: string | null;
  scheduleDate: string | null;
  total: number;
  receivedPct: number;
  lines: SrvPurchaseLine[];
};

export type SrvSupplier = {
  id: string;
  name: string;
  group: string;
  phone: string;
  city: string | null;
  outstanding: number;
};

// ---------------------------------------------------------------------------
// crm
// ---------------------------------------------------------------------------

export type SrvCustomer = {
  id: string;
  name: string;
  phone: string;
  group: string;
  since: string | null;
  lastVisit: string | null;
  visits: number;
  totalSpend: number;
  loyaltyPoints: number;
  loyaltyProgram: string | null;
  tags: string[];
};

export type SrvCustomerVisit = {
  invoice: string;
  date: string | null;
  time: string | null;
  amount: number;
  table: string | null;
  itemsLabel: string;
};

// ---------------------------------------------------------------------------
// reports
// ---------------------------------------------------------------------------

export type SrvPnl = {
  period: string;
  fromDate: string;
  toDate: string;
  revenue: number;
  netProfit: number;
  lines: { label: string; amount: number; indent: number }[];
  trend: { date: string; revenue: number }[];
  previous: { fromDate: string; toDate: string; revenue: number; netProfit: number };
};

export type SrvItemPerformance = {
  period: string;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  rows: {
    code: string;
    name: string;
    category: string;
    qty: number;
    revenue: number;
    sharePct: number;
  }[];
};

export type SrvBranches = {
  period: string;
  fromDate: string;
  toDate: string;
  previousFromDate: string;
  previousToDate: string;
  rows: {
    branch: string;
    revenue: number;
    orders: number;
    avgTicket: number;
    previousRevenue: number;
    /** null means "no baseline", which is not the same fact as 0% and must not
     *  render as a flat arrow. */
    deltaPct: number | null;
  }[];
};

// ---------------------------------------------------------------------------
// staff
// ---------------------------------------------------------------------------

export type SrvAttendance = {
  date: string;
  rows: {
    employee: string;
    employeeName: string;
    role: string;
    status: 'present' | 'absent' | 'half_day' | 'on_leave';
    inAt: string | null;
    outAt: string | null;
    /** 'attendance' = an HRMS record; 'checkin' = derived from the clock button. */
    source: 'attendance' | 'checkin' | 'none';
  }[];
};

export type SrvStaffPerformance = {
  period: string;
  fromDate: string;
  toDate: string;
  rows: {
    employee: string;
    employeeName: string;
    role: string;
    orders: number;
    sales: number;
    avgTicket: number;
    covers: number;
  }[];
};

export type SrvShifts = {
  date: string;
  rows: {
    ref: string;
    employee: string;
    employeeName: string;
    shiftType: string;
    startTime: string | null;
    endTime: string | null;
    startDate: string | null;
    endDate: string | null;
  }[];
};

export type SrvPayroll = {
  fromDate: string;
  toDate: string;
  totalNet: number;
  headcount: number;
  rows: {
    slip: string;
    employee: string;
    employeeName: string;
    role: string;
    gross: number;
    deductions: number;
    net: number;
    status: 'draft' | 'submitted' | 'paid';
  }[];
};

// ---- Marketing (naqsha_pos.api.marketing) ---------------------------------

export type SrvCampaign = {
  id: string;
  name: string;
  description: string | null;
  channel: 'whatsapp' | 'sms' | 'email';
  audience: 'all' | 'loyalty' | 'lapsed_30' | 'lapsed_90' | 'recent_30';
  audienceLabel: string;
  reach: number;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt: string | null;
  sentAt: string | null;
};

export type SrvCoupon = {
  ref: string;
  code: string | null;
  name: string;
  description: string | null;
  couponType: string | null;
  pricingRule: string | null;
  discountLabel: string;
  used: number;
  limit: number;
  validFrom: string | null;
  validUpto: string | null;
  status: 'active' | 'expired' | 'used_up' | 'scheduled';
};

// ---- Reservations (naqsha_pos.api.reservations) ---------------------------

export type SrvReservation = {
  ref: string;
  guestName: string;
  phone: string | null;
  customer: string | null;
  tableRef: string | null;
  reservedAt: string;
  partySize: number;
  status: 'booked' | 'seated' | 'cancelled' | 'no_show';
  seatedAt: string | null;
  notes: string | null;
};

export type SrvWaitlistEntry = {
  ref: string;
  guestName: string;
  phone: string | null;
  partySize: number;
  quotedWaitMin: number;
  status: 'waiting' | 'seated' | 'left';
  joinedAt: string;
  seatedAt: string | null;
  tableRef: string | null;
  notes: string | null;
};

// ---- Floor stats (naqsha_pos.api.floor.stats) -----------------------------

export type SrvFloorStats = {
  lowStock: number;
  pendingWastage: number;
  openTables: number;
  totalTables: number;
  activeOrders: number;
  avgPrepSeconds: number;
  slaBreaches: number;
  breachLabels: string[];
  feedbackDue: number;
  wastageValue: number;
  wastageCount: number;
  sessionRevenue: number;
};

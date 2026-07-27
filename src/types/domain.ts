/**
 * Ground-truth domain model for Naqsha. Components and hooks depend on these
 * types, never on endpoint shapes. When the real API contract lands, only
 * lib/api/* changes; these stay stable (handover §7).
 */

/**
 * A KDS station key.
 *
 * Deliberately `string`, not a union. The backend models `KDS Station.station_key`
 * as free-form Data precisely so the cafe can add a station without a schema change
 * and a migrate (PLAN_FRAPPE_BACKEND.md §2.3) — a union here would make a fourth
 * station a runtime ZodError instead of a new column.
 *
 * `KNOWN_STATIONS` is the three that exist today; layout code that genuinely needs a
 * fixed set (the manager aggregate's three-column grid) should use it and treat
 * anything else as an extra.
 */
export type Station = string;

export const KNOWN_STATIONS = ['drinks', 'main', 'bbq'] as const;

export type KotState = 'queued' | 'preparing' | 'breach' | 'prepared';

export type TableState =
  | 'free'
  | 'mine'
  | 'occupied'
  | 'active'
  | 'breach'
  | 'ready'
  | 'feedback'
  | 'billing';

export type Role = 'waiter' | 'manager' | 'owner' | 'kitchen';

// ---- People ---------------------------------------------------------------

export type Waiter = {
  id: string; // e.g. "W-04"
  name: string; // e.g. "Ahmed"
};

// ---- Menu -----------------------------------------------------------------

export type MenuCategory = {
  id: string;
  name: string;
  count: number;
  station: Station;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // PKR
  station: Station;
  categoryId: string;
  outOfStock?: boolean;
  outOfStockReason?: string;
};

// ---- Cart / orders --------------------------------------------------------

export type CartLine = {
  itemId: string;
  name: string;
  qty: number;
  price: number; // unit price, PKR
  station: Station;
  note?: string;
};

// ---- Tables ---------------------------------------------------------------

/** Per-station KOT progress bar shown on manager/waiter table cards. */
export type KotProgress = 'pending' | 'prep' | 'done';

export type Table = {
  ref: string; // "T-01"
  number: string; // "01"
  state: TableState;
  /**
   * Does this table belong to the requesting waiter?
   *
   * Kept separate from `state`, which collapses it: the adapter only renders `mine`
   * for a table sitting at plain `occupied`, so a waiter's own table that is cooking
   * comes through as `active` and ownership is lost. "My tables" is a question about
   * ownership, not about what the kitchen is doing.
   */
  isMine?: boolean;
  seats?: number;
  waiter?: Waiter;
  /** Human note shown under the number ("2 KOTs preparing", "4-top · window"). */
  meta?: string;
  pax?: number;
  amount?: number; // running total, PKR
  openedAtLabel?: string; // "19:52"
  /** Raw ISO session start; the bill derives its duration label from this. */
  openedAt?: string;
  /** KOT progress pips for manager floor cards. */
  kots?: KotProgress[];
  /** The one next action ("→ dispatch waiter"). */
  actionTag?: string;
  /** Status chip label + tone, when the card shows one. */
  statusTag?: { label: string; tone: ChipTone };
};

export type ChipTone = 'teal' | 'amber' | 'success' | 'alert' | 'muted' | 'ink';

export type TakeawayOrder = {
  ref: string; // "TAKE-041"
};

// ---- KDS / KOT ------------------------------------------------------------

export type KotItem = {
  name: string;
  qty: number;
  comment?: string;
};

export type Kot = {
  ref: string; // "KOT-D-1042"
  station: Station;
  tableRef: string; // "T-05" | "TAKE-042"
  items: KotItem[];
  state: KotState;
  /**
   * ISO timestamp the ticket entered its current running state (queued or
   * preparing). The live timer counts up from here, so the KDS clock keeps
   * ticking without a refetch. Maps to the KOT's `creation` / `started_at` in
   * Frappe. When present it drives the timer; the *Seconds seeds below are the
   * fallback for a static render.
   */
  receivedAt?: string;
  /** Seconds a queued ticket has waited (seed / fallback). */
  waitSeconds?: number;
  /** Seconds since entering Active — preparing/breach (seed / fallback). */
  elapsedSeconds?: number;
  /** Target prep time in seconds. */
  slaSeconds: number;
  /** For prepared tickets: total prep duration + on-time flag. */
  doneSeconds?: number;
  onTime?: boolean;
};

export type StationMeta = {
  station: Station;
  name: string; // "Drinks & coffee"
  stationId: string; // "DRINKS"
  slaSeconds: number;
  activeMax: number;
  avgPrepLabel: string; // "04:22"
  slaCompliancePct: number; // 86
  totalPrepared: number; // 142
};

/** A full KDS station board — queue / active / prepared columns (K-01). */
export type KdsBoard = {
  meta: StationMeta;
  queue: Kot[];
  active: Kot[];
  prepared: Kot[];
};

/** One table's readiness across all three stations (manager KDS aggregate). */
export type StationLine = {
  station: Station;
  items: string; // "2× cappuccino · 1× karak chai"
  status: 'queued' | 'prep' | 'ready' | 'none';
  statusLabel: string; // "✓ ready · 04:12" | "queued · 01:12 wait"
  overSla?: boolean;
};

export type AggregateRow = {
  tableRef: string;
  tableNumber: string;
  rowState: 'ready' | 'breach' | 'normal';
  stations: StationLine[];
  /** Action cell: dispatch / escalate / waiting. */
  action: {
    kind: 'dispatch' | 'escalate' | 'waiting';
    label: string;
    hint: string;
    /** For `escalate`: the station holding the table up, so the button can go there. */
    station?: Station;
  };
};

// ---- POS / billing --------------------------------------------------------

export type BillLine = {
  qty: number;
  name: string;
  station: Station;
  rate: number;
  amount: number;
};

export type OrderBatch = {
  /** null for the opening batch; a label like "batch 2 @ 19:22" otherwise. */
  label: string | null;
  lines: BillLine[];
};

export type MopKind = 'cash' | 'card' | 'wallet';

export type PosInvoice = {
  ref: string; // "INV-C-2026-0231"
  tableRef: string;
  tableNumber: string;
  pax: number;
  waiter: Waiter;
  openedAtLabel: string; // "18:44"
  durationLabel: string; // "1h 26m"
  batches: OrderBatch[];
  subtotalItems: number;
  subtotal: number;
  serviceChargePct: number;
  serviceCharge: number;
  discount?: number;
  discountLabel?: string;
  /** Coupon applied to this bill: the document ref and the code the guest quoted. */
  couponRef?: string;
  couponCode?: string;
  /**
   * Tax rows exactly as ERPNext computed them (e.g. "PRA 15%"). Carried, not derived:
   * the preview has to add up to `grandTotal` on screen, and tax is most of the gap
   * between the subtotal and what the guest actually pays.
   */
  taxes: { description: string; rate: number; amount: number }[];
  grandTotal: number;
  /** The site's real Mode of Payment names, from the server. */
  modesOfPayment?: string[];
};

// ---- Wastage --------------------------------------------------------------

export type WastageReason = 'spillage' | 'refused' | 'cook_error' | 'expired' | 'other';

export type WastageStatus = 'pending' | 'approved' | 'rejected';

export type WastageItem = {
  name: string;
  code: string; // "FIN-CHK-HDI"
  qty: number;
  uom: string; // "plate" | "pc" | "kg"
  rate: number; // avg cost, PKR
  amount: number;
};

export type Wastage = {
  ref: string; // "WST-C-2026-0018"
  reason: WastageReason;
  reasonLabel: string; // "Spillage"
  note?: string;
  items: WastageItem[];
  totalValue: number;
  managerLabel: string; // "Bilal (M-01)"
  reportedAtLabel: string; // "Today · 20:14"
  evidenceCount: number;
  status: WastageStatus;
  /** Severity chip on the approval card. */
  tag?: { label: string; tone: ChipTone };
};

// ---- Feedback -------------------------------------------------------------

export type FeedbackContext = {
  tableSlug: string;
  tableRef: string; // "T-02"
  invoiceRef: string; // "INV-C-2026-0234"
  branchLabel: string; // "Naqsha Cafe · Lahore"
  ownerFirstName: string; // "Zafar bhai"
  dishOptions: string[]; // dishes eaten, for the "what did you love" chips
};

export type FeedbackSubmission = {
  tableSlug: string;
  rating: number; // 1..5
  likedDishes: string[];
  comment?: string;
  phone?: string;
};

// ---- Owner dashboard ------------------------------------------------------

export type PnlLine = {
  label: string;
  value: number; // signed; negatives are costs
  pct: string; // "41.1%"
};

export type PnlSummary = {
  netProfit: number;
  periodLabel: string; // "Wed 16 Jul · 08:00 – 22:14"
  deltaLabel: string; // "↑ 14.2% vs 7-day avg"
  lines: PnlLine[]; // gross, cogs, wastage, fixed, utilities, net
};

export type MiniStat = {
  label: string;
  value: string; // pre-formatted with currency where needed
  delta: string;
  deltaTone: 'up' | 'down' | 'muted';
  aux: string;
};

export type HourBar = {
  hour: string; // "08"
  pct: number; // 0..100 bar height
  peak?: boolean;
};

export type DishRank = {
  rank: number;
  name: string;
  category: string; // "Main"
  count: number;
  revenue: number;
};

export type OwnerDashboard = {
  greet: string; // "Wed 16 July · closing summary"
  ownerName: string; // "Zafar bhai"
  lead: string;
  pnl: PnlSummary;
  miniStats: MiniStat[];
  revenueByHour: HourBar[];
  peakNote: string;
  bestDishes: DishRank[];
  bottomNote: string;
};

// ---- Session --------------------------------------------------------------

export type SessionIdentity = {
  role: Role;
  waiter?: Waiter;
  branchLabel: string; // "Cafe · Lahore branch"
  shiftLabel?: string; // "Shift 18:00–02:00"
  sessionRef?: string; // "S-2026-198"
};

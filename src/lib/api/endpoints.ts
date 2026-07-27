/**
 * Endpoint registry — the single source of truth for every backend path.
 *
 * Two families, per NAQSHA_API_CONTRACT.md §1:
 *
 *   METHODS   naqsha_pos.api.<module>.<fn>   composed operations, camelCase in and out
 *   RESOURCE  /api/resource/{DocType}        plain CRUD, snake_case, adapted in lib/api/*
 *
 * METHODS holds bare method names, not URLs — `apiGet`/`apiPost` in http.ts prepend
 * `/api/method/`. Query strings are passed as objects, so nothing here has to think
 * about encoding.
 */

/** Whitelisted methods. This is the entire custom server surface. */
export const METHODS = {
  // ---- auth (Frappe's own login/logout are not namespaced) ----
  login: 'login',
  logout: 'logout',
  session: 'naqsha_pos.api.auth.session',

  // ---- floor ----
  tables: 'naqsha_pos.api.floor.tables',
  openTable: 'naqsha_pos.api.floor.open_table',
  dispatchTable: 'naqsha_pos.api.floor.dispatch_table',
  floorStats: 'naqsha_pos.api.floor.stats',
  closeTable: 'naqsha_pos.api.floor.close_table',

  // ---- menu ----
  menuCategories: 'naqsha_pos.api.menu.categories',
  menuItems: 'naqsha_pos.api.menu.items',
  toggle86: 'naqsha_pos.api.menu.toggle_86',

  // ---- ordering ----
  submitOrder: 'naqsha_pos.api.order.submit_order',
  appendItems: 'naqsha_pos.api.order.append_items',

  // ---- kds ----
  kdsBoard: 'naqsha_pos.api.kds.board',
  kdsAggregate: 'naqsha_pos.api.kds.aggregate',
  advanceKot: 'naqsha_pos.api.kds.advance_kot',

  // ---- billing ----
  getInvoice: 'naqsha_pos.api.billing.get_invoice',
  // Creating the bill is a POST: Frappe rolls back non-POST requests, so the old
  // GET-that-writes never persisted the draft. See lib/api/pos.ts.
  openInvoice: 'naqsha_pos.api.billing.open_invoice',
  updateInvoice: 'naqsha_pos.api.billing.update_invoice',
  payInvoice: 'naqsha_pos.api.billing.pay_invoice',
  refund: 'naqsha_pos.api.billing.refund',
  fiscalReceipt: 'naqsha_pos.api.billing.fiscal_receipt',

  // ---- wastage (reads only; writes go through RESOURCE + the workflow) ----
  wastageCounts: 'naqsha_pos.api.wastage.counts',
  wastageSummary: 'naqsha_pos.api.wastage.summary',

  // ---- inventory ----
  stockLevels: 'naqsha_pos.api.inventory.stock_levels',
  recipe: 'naqsha_pos.api.inventory.recipe',
  boms: 'naqsha_pos.api.inventory.boms',
  cogs: 'naqsha_pos.api.inventory.cogs',
  adjustStock: 'naqsha_pos.api.inventory.adjust_stock',

  // ---- purchasing ----
  purchaseOrders: 'naqsha_pos.api.purchasing.orders',
  suppliers: 'naqsha_pos.api.purchasing.suppliers',
  createSupplier: 'naqsha_pos.api.purchasing.create_supplier',
  createPurchaseOrder: 'naqsha_pos.api.purchasing.create_order',
  receivePurchaseOrder: 'naqsha_pos.api.purchasing.receive_order',

  // ---- crm ----
  customers: 'naqsha_pos.api.crm.customers',
  customerHistory: 'naqsha_pos.api.crm.customer_history',
  saveCustomer: 'naqsha_pos.api.crm.save_customer',
  loyaltyBalance: 'naqsha_pos.api.loyalty.balance',

  // ---- owner / reports ----
  ownerDashboard: 'naqsha_pos.api.owner.dashboard',
  reportPnl: 'naqsha_pos.api.reports.pnl',
  reportItems: 'naqsha_pos.api.reports.item_performance',
  reportBranches: 'naqsha_pos.api.reports.branches',

  // ---- staff ----
  clock: 'naqsha_pos.api.staff.clock',
  myShift: 'naqsha_pos.api.staff.my_shift',
  attendance: 'naqsha_pos.api.staff.attendance',
  staffPerformance: 'naqsha_pos.api.staff.performance',
  shifts: 'naqsha_pos.api.staff.shifts',
  assignShift: 'naqsha_pos.api.staff.assign_shift',
  payroll: 'naqsha_pos.api.staff.payroll',

  // ---- marketing ----
  campaigns: 'naqsha_pos.api.marketing.campaigns',
  saveCampaign: 'naqsha_pos.api.marketing.save_campaign',
  sendCampaign: 'naqsha_pos.api.marketing.send_campaign',
  audiencePreview: 'naqsha_pos.api.marketing.audience_preview',
  coupons: 'naqsha_pos.api.marketing.coupons',
  saveCoupon: 'naqsha_pos.api.marketing.save_coupon',

  // ---- reservations & waitlist ----
  reservations: 'naqsha_pos.api.reservations.reservations',
  saveReservation: 'naqsha_pos.api.reservations.save_reservation',
  setReservationStatus: 'naqsha_pos.api.reservations.set_reservation_status',
  waitlist: 'naqsha_pos.api.reservations.waitlist',
  addWalkin: 'naqsha_pos.api.reservations.add_walkin',
  setWaitlistStatus: 'naqsha_pos.api.reservations.set_waitlist_status',

  // ---- guest (allow_guest, rate-limited; always call with authScope:'guest') ----
  guestMenu: 'naqsha_pos.api.guest.menu',
  guestPlaceOrder: 'naqsha_pos.api.guest.place_order',
  guestFeedbackContext: 'naqsha_pos.api.guest.feedback_context',
  guestSubmitFeedback: 'naqsha_pos.api.guest.submit_feedback',

  // ---- framework ----
  applyWorkflow: 'frappe.model.workflow.apply_workflow',
  queryReport: 'frappe.desk.query_report.run',
} as const;

/** DocTypes reached over /api/resource. */
export const RESOURCE = {
  wastageEntry: 'Wastage Entry',
  wastageItem: 'Wastage Item',
  wastageEvidence: 'Wastage Evidence',
  employee: 'Employee',
  item: 'Item',
  itemGroup: 'Item Group',
  customer: 'Customer',
  salesInvoice: 'Sales Invoice',
  stockEntry: 'Stock Entry',
} as const;

/**
 * Realtime events published by naqsha_pos.core.realtime. Payloads are hints for
 * which query key to invalidate, never data to render.
 */
export const EVENTS = {
  kotUpdate: 'naqsha:kot_update',
  tableUpdate: 'naqsha:table_update',
  invoiceUpdate: 'naqsha:invoice_update',
  menuUpdate: 'naqsha:menu_update',
} as const;

/**
 * Legacy registry, still imported by src/lib/api/erp.ts for the one screen group that
 * remains on mock data: **menu admin**.
 *
 * Everything else has moved to METHODS above — inventory, purchasing, CRM, reports and
 * staff first, then marketing and reservations, which now have real DocTypes
 * (`Table Reservation`, `Waitlist Entry`) and real methods behind them.
 *
 * These paths are never actually requested: erp.ts pins the remaining getters to mocks
 * with its own ERP_USE_MOCKS constant, independent of VITE_USE_MOCKS.
 */
export const ENDPOINTS = {
  menuAdminItems: () => '/api/resource/Item',
  combos: () => '/api/resource/Product Bundle',
  timedMenus: () => '/api/resource/Pricing Rule',
} as const;

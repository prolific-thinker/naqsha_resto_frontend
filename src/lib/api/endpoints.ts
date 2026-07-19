/**
 * Endpoint registry — the single source of truth for every backend path the
 * frontend calls. Paths are relative to VITE_API_BASE (see src/lib/api/http.ts).
 *
 * These are the SUGGESTED routes; rename them to match your backend and nothing
 * else in the app needs to change. Read endpoints (getters) are already wired
 * through the mock/http switch; write endpoints are listed here ready to call
 * from a mutation wrapper (see INTEGRATION.md §4).
 */
import type { Station } from '@/types/domain';

export const ENDPOINTS = {
  // ---- Reads (wired) ----
  waiterTables: () => '/floor/tables?role=waiter',
  managerTables: () => '/floor/tables?role=manager',
  takeaway: () => '/takeaway/active',
  menuCategories: () => '/menu/categories',
  menuItems: () => '/menu/items',
  kdsBoard: (station: Station) => `/kds/${station}`,
  kdsAggregate: () => '/kds/aggregate',
  invoice: (tableRef: string) => `/pos/invoice?table=${encodeURIComponent(tableRef)}`,
  ownerDashboard: (period = 'day') => `/owner/dashboard?period=${period}`,
  wastagePending: () => '/wastage/approvals?status=pending',
  wastageCounts: () => '/wastage/approvals/counts',
  wastageWeek: () => '/wastage/summary?range=week',
  feedbackContext: (tableSlug: string) => `/feedback/context?t=${encodeURIComponent(tableSlug)}`,

  // ---- Writes ----
  submitFeedback: () => '/feedback', // wired
  // The rest have UI triggers but no wrapper yet — see INTEGRATION.md §4.
  submitOrder: () => '/orders',
  updateOrder: (invoiceRef: string) => `/orders/${invoiceRef}`,
  advanceKot: (kotRef: string) => `/kds/kot/${kotRef}/advance`,
  dispatchTable: (tableRef: string) => `/kds/aggregate/${tableRef}/dispatch`,
  payInvoice: (invoiceRef: string) => `/pos/invoice/${invoiceRef}/pay`,
  submitWastage: () => '/wastage',
  decideWastage: (wastageRef: string) => `/wastage/${wastageRef}/decision`,
} as const;

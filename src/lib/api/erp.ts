/**
 * ERPNext-backed feature set: inventory, purchasing, CRM, reports and staff — all now
 * live against `naqsha_pos.api.*`. Menu admin, marketing and reservations remain on
 * mocks; those are v1.1 by contract (NAQSHA_API_CONTRACT.md §16) and their DocTypes do
 * not exist on the site.
 *
 * Shape of every wired getter below:
 *
 *     apiGet(METHODS.x) -> unwrapOk -> adapter -> schema.parse
 *
 * `unwrapOk` first, always. A guard failure comes back as HTTP 200 with
 * `{ok:false, code}`, and feeding that to an adapter produces a ZodError complaining
 * about a missing field rather than the permission message the server actually sent.
 *
 * The `enabled` gating and period arguments live in hooks/useErp.ts, not here.
 */
import { z } from 'zod';
import type {
  MenuAdminItem,
  Combo,
  TimedMenu,
  StockRow,
  Bom,
  CogsSummary,
  PurchaseOrder,
  Supplier,
  Customer,
  CustomerVisit,
  Campaign,
  Coupon,
  Reservation,
  WaitlistEntry,
  PnlReport,
  ItemPerfRow,
  BranchRow,
  AttendanceRow,
  StaffPerfRow,
  ShiftRow,
  PayrollSummary,
} from '@/types/erp';
import {
  MenuAdminItemSchema,
  ComboSchema,
  TimedMenuSchema,
  StockRowSchema,
  BomSchema,
  CogsSummarySchema,
  PurchaseOrderSchema,
  SupplierSchema,
  CustomerSchema,
  CustomerVisitSchema,
  CampaignSchema,
  CouponSchema,
  ReservationSchema,
  WaitlistEntrySchema,
  PnlReportSchema,
  ItemPerfRowSchema,
  BranchRowSchema,
  AttendanceRowSchema,
  StaffPerfRowSchema,
  ShiftRowSchema,
  PayrollSummarySchema,
} from '@/types/erp.api';
import type * as S from '@/types/server';
import { mockGet } from './client';
import { apiGet, httpGet, unwrapOk } from './http';
import { METHODS, ENDPOINTS } from './endpoints';
import * as M from '@/lib/mocks/erp';
import { toStockRow, toBom, toCogsSummary } from './adapters/inventory';
import { toPurchaseOrder, toSupplier } from './adapters/purchasing';
import { toCustomer, toCustomerVisit } from './adapters/crm';
import { toPnlReport, toItemPerfRows, toBranchRows } from './adapters/reports';
import {
  toAttendanceRows,
  toStaffPerfRows,
  toShiftRows,
  toPayrollSummary,
} from './adapters/staff';
import { toCampaign, toCoupon } from './adapters/marketing';
import { toReservation, toWaitlistEntry } from './adapters/reservations';

/** The period selector on the inventory, report and staff screens. */
export type Period = 'day' | 'week' | 'month';

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function getStockLevels(warehouse?: string): Promise<StockRow[]> {
  const raw = unwrapOk(await apiGet<S.SrvStockRow[]>(METHODS.stockLevels, { query: { warehouse } }));
  return z.array(StockRowSchema).parse(raw.map(toStockRow));
}

export async function getBoms(): Promise<Bom[]> {
  const raw = unwrapOk(await apiGet<S.SrvBom[]>(METHODS.boms));
  return z.array(BomSchema).parse(raw.map(toBom));
}

export async function getCogsSummary(period: Period = 'week'): Promise<CogsSummary> {
  const raw = unwrapOk(await apiGet<S.SrvCogs>(METHODS.cogs, { query: { period } }));
  return CogsSummarySchema.parse(toCogsSummary(raw));
}

// ---------------------------------------------------------------------------
// Purchasing
// ---------------------------------------------------------------------------

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const raw = unwrapOk(await apiGet<S.SrvPurchaseOrder[]>(METHODS.purchaseOrders));
  return z.array(PurchaseOrderSchema).parse(raw.map(toPurchaseOrder));
}

export async function getSuppliers(): Promise<Supplier[]> {
  const raw = unwrapOk(await apiGet<S.SrvSupplier[]>(METHODS.suppliers));
  return z.array(SupplierSchema).parse(raw.map(toSupplier));
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export async function getCustomers(search?: string): Promise<Customer[]> {
  const raw = unwrapOk(await apiGet<S.SrvCustomer[]>(METHODS.customers, { query: { search } }));
  return z.array(CustomerSchema).parse(raw.map(toCustomer));
}

export async function getCustomerHistory(customer: string): Promise<CustomerVisit[]> {
  const raw = unwrapOk(
    await apiGet<S.SrvCustomerVisit[]>(METHODS.customerHistory, { query: { customer } }),
  );
  return z.array(CustomerVisitSchema).parse(raw.map(toCustomerVisit));
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function getPnlReport(period: Period = 'week'): Promise<PnlReport> {
  const raw = unwrapOk(await apiGet<S.SrvPnl>(METHODS.reportPnl, { query: { period } }));
  return PnlReportSchema.parse(toPnlReport(raw));
}

export async function getItemPerformance(period: Period = 'week'): Promise<ItemPerfRow[]> {
  const raw = unwrapOk(await apiGet<S.SrvItemPerformance>(METHODS.reportItems, { query: { period } }));
  return z.array(ItemPerfRowSchema).parse(toItemPerfRows(raw));
}

export async function getBranchReport(period: Period = 'week'): Promise<BranchRow[]> {
  const raw = unwrapOk(await apiGet<S.SrvBranches>(METHODS.reportBranches, { query: { period } }));
  return z.array(BranchRowSchema).parse(toBranchRows(raw));
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export async function getAttendance(date?: string): Promise<AttendanceRow[]> {
  const raw = unwrapOk(await apiGet<S.SrvAttendance>(METHODS.attendance, { query: { date } }));
  return z.array(AttendanceRowSchema).parse(toAttendanceRows(raw));
}

export async function getStaffPerformance(period: Period = 'week'): Promise<StaffPerfRow[]> {
  const raw = unwrapOk(
    await apiGet<S.SrvStaffPerformance>(METHODS.staffPerformance, { query: { period } }),
  );
  return z.array(StaffPerfRowSchema).parse(toStaffPerfRows(raw));
}

export async function getShifts(date?: string): Promise<ShiftRow[]> {
  const raw = unwrapOk(await apiGet<S.SrvShifts>(METHODS.shifts, { query: { date } }));
  return z.array(ShiftRowSchema).parse(toShiftRows(raw));
}

export async function getPayroll(month?: string): Promise<PayrollSummary> {
  const raw = unwrapOk(await apiGet<S.SrvPayroll>(METHODS.payroll, { query: { month } }));
  return PayrollSummarySchema.parse(toPayrollSummary(raw));
}

// ---------------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------------

export async function getCampaigns(): Promise<Campaign[]> {
  const raw = unwrapOk(await apiGet<S.SrvCampaign[]>(METHODS.campaigns));
  return z.array(CampaignSchema).parse(raw.map(toCampaign));
}

export async function getCoupons(): Promise<Coupon[]> {
  const raw = unwrapOk(await apiGet<S.SrvCoupon[]>(METHODS.coupons));
  return z.array(CouponSchema).parse(raw.map(toCoupon));
}

// ---------------------------------------------------------------------------
// Reservations & waitlist
// ---------------------------------------------------------------------------

export type ReservationScope = 'upcoming' | 'today' | 'all';
export type WaitlistScope = 'open' | 'today' | 'all';

export async function getReservations(scope: ReservationScope = 'upcoming'): Promise<Reservation[]> {
  const raw = unwrapOk(await apiGet<S.SrvReservation[]>(METHODS.reservations, { query: { scope } }));
  return z.array(ReservationSchema).parse(raw.map(toReservation));
}

export async function getWaitlist(scope: WaitlistScope = 'open'): Promise<WaitlistEntry[]> {
  const raw = unwrapOk(await apiGet<S.SrvWaitlistEntry[]>(METHODS.waitlist, { query: { scope } }));
  return z.array(WaitlistEntrySchema).parse(raw.map((r) => toWaitlistEntry(r)));
}

// ---------------------------------------------------------------------------
// Still on mocks — menu admin only
// ---------------------------------------------------------------------------
// Product Bundle / timed Pricing Rule authoring. Pinned with its own constant rather
// than VITE_USE_MOCKS, which is `false`: on the global flag it would fire requests at
// `/api/resource` paths nothing composes yet and replace a working demo screen with an
// error state. This screen still carries the "Preview · not wired" badge.

const ERP_USE_MOCKS = true;

function listGetter<T>(schema: z.ZodType<T>, mock: T[], path: string) {
  const arr = z.array(schema);
  return (): Promise<T[]> => (ERP_USE_MOCKS ? mockGet(arr, mock) : httpGet(path, arr));
}

export const getMenuAdminItems = listGetter<MenuAdminItem>(MenuAdminItemSchema, M.MENU_ADMIN_ITEMS, ENDPOINTS.menuAdminItems());
export const getCombos = listGetter<Combo>(ComboSchema, M.COMBOS, ENDPOINTS.combos());
export const getTimedMenus = listGetter<TimedMenu>(TimedMenuSchema, M.TIMED_MENUS, ENDPOINTS.timedMenus());

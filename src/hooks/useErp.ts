/**
 * TanStack Query hooks for the ERPNext-backed feature set.
 *
 * The period-scoped ones take the period as an argument AND put it in the query key,
 * so switching from week to month refetches instead of showing last week's numbers
 * under a "month" heading. That is not a caching nicety — an owner reading a monthly
 * P&L that is actually a weekly one will make a decision on it.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMenuAdminItems,
  getCombos,
  getTimedMenus,
  getStockLevels,
  getBoms,
  getCogsSummary,
  getPurchaseOrders,
  getSuppliers,
  getCustomers,
  getCustomerHistory,
  getCampaigns,
  getCoupons,
  getReservations,
  getWaitlist,
  getPnlReport,
  getItemPerformance,
  getBranchReport,
  getAttendance,
  getStaffPerformance,
  getShifts,
  getPayroll,
  type Period,
  type ReservationScope,
  type WaitlistScope,
} from '@/lib/api/erp';
import * as api from '@/lib/api/mutations';
import { isFailure } from '@/lib/api/http';

export type { Period, ReservationScope, WaitlistScope };

// ---- Menu admin (still mocked, v1.1) --------------------------------------

export const useMenuAdminItems = () => useQuery({ queryKey: ['menu-admin', 'items'], queryFn: getMenuAdminItems });
export const useCombos = () => useQuery({ queryKey: ['menu-admin', 'combos'], queryFn: getCombos });
export const useTimedMenus = () => useQuery({ queryKey: ['menu-admin', 'timed'], queryFn: getTimedMenus });

// ---- Marketing ------------------------------------------------------------

export const useCampaigns = () => useQuery({ queryKey: ['crm', 'campaigns'], queryFn: getCampaigns });
export const useCoupons = () => useQuery({ queryKey: ['crm', 'coupons'], queryFn: getCoupons });

// ---- Reservations & waitlist ---------------------------------------------
// Scope is in the query key as well as the argument, so switching from "upcoming" to
// "all" refetches rather than rendering one list under the other's heading.

export const useReservations = (scope: ReservationScope = 'upcoming') =>
  useQuery({ queryKey: ['reservations', 'list', scope], queryFn: () => getReservations(scope) });

export const useWaitlist = (scope: WaitlistScope = 'open') =>
  useQuery({
    queryKey: ['reservations', 'waitlist', scope],
    queryFn: () => getWaitlist(scope),
    // The door list is a clock: "waiting 25 min" is stale the minute after it renders.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

// ---- Inventory ------------------------------------------------------------

export const useStockLevels = (warehouse?: string) =>
  useQuery({ queryKey: ['inventory', 'stock', warehouse ?? 'default'], queryFn: () => getStockLevels(warehouse) });

export const useBoms = () => useQuery({ queryKey: ['inventory', 'boms'], queryFn: getBoms });

export const useCogsSummary = (period: Period = 'week') =>
  useQuery({ queryKey: ['inventory', 'cogs', period], queryFn: () => getCogsSummary(period) });

// ---- Purchasing -----------------------------------------------------------

export const usePurchaseOrders = () => useQuery({ queryKey: ['purchasing', 'orders'], queryFn: getPurchaseOrders });
export const useSuppliers = () => useQuery({ queryKey: ['purchasing', 'suppliers'], queryFn: getSuppliers });

// ---- CRM ------------------------------------------------------------------

export const useCustomers = () => useQuery({ queryKey: ['crm', 'customers'], queryFn: () => getCustomers() });

/** Only fires once a customer is selected — see `crm.customer_history`'s docstring. */
export const useCustomerHistory = (customer: string | null | undefined) =>
  useQuery({
    queryKey: ['crm', 'history', customer],
    queryFn: () => getCustomerHistory(customer as string),
    enabled: !!customer,
  });

// ---- Reports --------------------------------------------------------------

export const usePnlReport = (period: Period = 'week') =>
  useQuery({ queryKey: ['reports', 'pnl', period], queryFn: () => getPnlReport(period) });

export const useItemPerformance = (period: Period = 'week') =>
  useQuery({ queryKey: ['reports', 'items', period], queryFn: () => getItemPerformance(period) });

export const useBranchReport = (period: Period = 'week') =>
  useQuery({ queryKey: ['reports', 'branches', period], queryFn: () => getBranchReport(period) });

// ---- Staff ----------------------------------------------------------------

export const useAttendance = (date?: string) =>
  useQuery({ queryKey: ['staff', 'attendance', date ?? 'today'], queryFn: () => getAttendance(date) });

export const useStaffPerformance = (period: Period = 'week') =>
  useQuery({ queryKey: ['staff', 'performance', period], queryFn: () => getStaffPerformance(period) });

export const useShifts = (date?: string) =>
  useQuery({ queryKey: ['staff', 'shifts', date ?? 'today'], queryFn: () => getShifts(date) });

export const usePayroll = (month?: string) =>
  useQuery({ queryKey: ['staff', 'payroll', month ?? 'current'], queryFn: () => getPayroll(month) });

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
// `retry: 0` on every one of these. None of the underlying documents carries an
// `offline_ref`, so a retried insert is a duplicate Stock Entry or a second purchase
// order to the same supplier — the framework has no way to collapse them.

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.adjustStock>[0]) => api.adjustStock(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.createSupplier>[0]) => api.createSupplier(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['purchasing'] });
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.createPurchaseOrder>[0]) => api.createPurchaseOrder(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['purchasing'] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: string) => api.receivePurchaseOrder(order),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['purchasing'] });
      // A receipt moves stock, so the inventory screen is stale too.
      void qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.saveCustomer>[0]) => api.saveCustomer(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['crm'] });
    },
  });
}

export function useAssignShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.assignShift>[0]) => api.assignShift(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['staff', 'shifts'] });
    },
  });
}

// ---- Marketing writes -----------------------------------------------------

export function useSaveCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.saveCampaign>[0]) => api.saveCampaign(vars),
    // No offline_ref on Campaign, so a retried insert would be a duplicate campaign.
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['crm', 'campaigns'] });
    },
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaign: string) => api.sendCampaign(campaign),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['crm', 'campaigns'] });
    },
  });
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.saveCoupon>[0]) => api.saveCoupon(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['crm', 'coupons'] });
    },
  });
}

// ---- Reservation & waitlist writes ---------------------------------------

export function useSaveReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.saveReservation>[0]) => api.saveReservation(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useSetReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.setReservationStatus>[0]) =>
      api.setReservationStatus(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['reservations'] });
      // Seating opens the table server-side, so the floor is stale too.
      void qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useAddWalkin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.addWalkin>[0]) => api.addWalkin(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['reservations', 'waitlist'] });
    },
  });
}

export function useSetWaitlistStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.setWaitlistStatus>[0]) =>
      api.setWaitlistStatus(vars),
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['reservations', 'waitlist'] });
      void qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

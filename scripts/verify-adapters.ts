/**
 * Runs every adapter + Zod schema against the LIVE backend, outside the browser.
 *
 *   node --run verify:adapters      (see package.json)
 *
 * This exists because the adapters are the one layer where a shape mismatch is
 * invisible until a screen renders. Frappe sends JSON `null` where Zod's
 * `.optional()` wants `undefined`, so "the curl looked fine" is not evidence.
 */
import { z } from 'zod';
import {
  AggregateRowSchema,
  KdsBoardSchema,
  MenuCategorySchema,
  MenuItemSchema,
  OwnerDashboardSchema,
  PosInvoiceSchema,
  TableSchema,
  WastageCountsSchema,
} from '@/types/api';
import {
  AttendanceRowSchema,
  BomSchema,
  BranchRowSchema,
  CogsSummarySchema,
  CustomerSchema,
  CustomerVisitSchema,
  ItemPerfRowSchema,
  PayrollSummarySchema,
  CampaignSchema,
  CouponSchema,
  ReservationSchema,
  WaitlistEntrySchema,
  PnlReportSchema,
  PurchaseOrderSchema,
  ShiftRowSchema,
  StaffPerfRowSchema,
  StockRowSchema,
  SupplierSchema,
} from '@/types/erp.api';
import { toAggregateRow, toKdsBoard, toMenuCategory, toMenuItem, toPosInvoice, toTableList } from '@/lib/api/adapters';
import { toOwnerDashboard } from '@/lib/api/adapters/owner';
import { toBom, toCogsSummary, toStockRow } from '@/lib/api/adapters/inventory';
import { toPurchaseOrder, toSupplier } from '@/lib/api/adapters/purchasing';
import { toCustomer, toCustomerVisit } from '@/lib/api/adapters/crm';
import { toBranchRows, toItemPerfRows, toPnlReport } from '@/lib/api/adapters/reports';
import { toCampaign, toCoupon } from '@/lib/api/adapters/marketing';
import { toReservation, toWaitlistEntry } from '@/lib/api/adapters/reservations';
import {
  toAttendanceRows,
  toPayrollSummary,
  toShiftRows,
  toStaffPerfRows,
} from '@/lib/api/adapters/staff';
import type * as S from '@/types/server';

const BASE = process.env.NAQSHA_BASE ?? 'http://naqsha_ops.localhost:8080';
const USER = process.env.NAQSHA_USER ?? 'manager@naqsha.local';
const PASS = process.env.NAQSHA_PASS ?? 'Naqsha@2026';

let cookie = '';
let failures = 0;

async function call(method: string, query: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${BASE}/api/method/${method}${qs ? `?${qs}` : ''}`, {
    headers: { Accept: 'application/json', Cookie: cookie },
  });
  const body = (await res.json()) as { message?: unknown };
  if (!res.ok) throw new Error(`${method} → ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body.message;
}

async function login(): Promise<void> {
  const res = await fetch(`${BASE}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usr: USER, pwd: PASS }),
  });
  if (!res.ok) throw new Error(`login → ${res.status}`);
  cookie = (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .join('; ');
  if (!cookie) throw new Error('login returned no cookies');
}

function check(label: string, fn: () => unknown): void {
  try {
    const out = fn();
    const n = Array.isArray(out) ? `${out.length} rows` : 'ok';
    console.log(`  ✓ ${label.padEnd(28)} ${n}`);
  } catch (err) {
    failures += 1;
    const msg = err instanceof z.ZodError ? JSON.stringify(err.issues.slice(0, 4), null, 2) : String(err);
    console.log(`  ✗ ${label.padEnd(28)} ${msg}`);
  }
}

async function main(): Promise<void> {
  console.log(`\nVerifying adapters against ${BASE} as ${USER}\n`);
  await login();

  const tables = (await call('naqsha_pos.api.floor.tables', { scope: 'all' })) as S.SrvTable[];
  check('floor.tables', () => z.array(TableSchema).parse(toTableList(tables)));

  const cats = (await call('naqsha_pos.api.menu.categories')) as S.SrvCategory[];
  check('menu.categories', () => z.array(MenuCategorySchema).parse(cats.map(toMenuCategory)));

  const items = (await call('naqsha_pos.api.menu.items')) as S.SrvMenuItem[];
  check('menu.items', () => z.array(MenuItemSchema).parse(items.map(toMenuItem)));

  for (const station of ['drinks', 'main', 'bbq']) {
    const board = (await call('naqsha_pos.api.kds.board', { station })) as S.SrvKdsBoard;
    check(`kds.board(${station})`, () => KdsBoardSchema.parse(toKdsBoard(board)));
  }

  const agg = (await call('naqsha_pos.api.kds.aggregate')) as S.SrvAggregateRow[];
  check('kds.aggregate', () => z.array(AggregateRowSchema).parse(agg.map((r) => toAggregateRow(r))));

  const counts = (await call('naqsha_pos.api.wastage.counts')) as S.SrvWastageCounts;
  check('wastage.counts', () =>
    WastageCountsSchema.parse({ pending: counts.pending, approved: counts.approved, rejected: counts.rejected }),
  );

  const dash = (await call('naqsha_pos.api.owner.dashboard', { period: 'day' })) as S.SrvOwnerDashboard;
  check('owner.dashboard', () =>
    OwnerDashboardSchema.parse(
      toOwnerDashboard(dash, {
        ownerName: 'Rafi Ahmed',
        categoryByCode: new Map(items.map((i) => [i.code, i.category])),
      }),
    ),
  );

  // Needs a table that already has a DRAFT INVOICE, not merely an open order.
  // `get_invoice` is a pure read now and answers NO_INVOICE for an un-billed table;
  // creating one here would make a verifier that mutates the floor it is checking.
  const billable = tables.find((t) => t.activeInvoice);
  if (billable) {
    const inv = (await call('naqsha_pos.api.billing.get_invoice', { table: billable.ref })) as S.SrvInvoice;
    check('billing.get_invoice', () =>
      PosInvoiceSchema.parse(
        toPosInvoice(inv, {
          stationByCode: new Map(items.map((i) => [i.code, i.station ?? 'main'])),
          openedAt: billable.openedAt,
        }),
      ),
    );
  } else {
    console.log('  – billing.get_invoice          skipped (no table has an open bill)');
  }

  await verifyErp();

  console.log(failures ? `\n${failures} adapter(s) FAILED\n` : '\nAll adapters parse live payloads cleanly\n');
  process.exit(failures ? 1 : 0);
}

/**
 * The ERP surface: inventory, purchasing, CRM, reports and staff.
 *
 * Every one of these is period- or selection-scoped, so the checks below use the
 * widest window ('month'). A method that parses on an empty day and breaks on a full
 * one has not been verified.
 */
async function verifyErp(): Promise<void> {
  const stock = (await call('naqsha_pos.api.inventory.stock_levels')) as S.SrvStockRow[];
  check('inventory.stock_levels', () => z.array(StockRowSchema).parse(stock.map(toStockRow)));

  const boms = (await call('naqsha_pos.api.inventory.boms')) as S.SrvBom[];
  check('inventory.boms', () => z.array(BomSchema).parse(boms.map(toBom)));

  const cogs = (await call('naqsha_pos.api.inventory.cogs', { period: 'month' })) as S.SrvCogs;
  check('inventory.cogs', () => CogsSummarySchema.parse(toCogsSummary(cogs)));

  const orders = (await call('naqsha_pos.api.purchasing.orders')) as S.SrvPurchaseOrder[];
  check('purchasing.orders', () => z.array(PurchaseOrderSchema).parse(orders.map(toPurchaseOrder)));

  const suppliers = (await call('naqsha_pos.api.purchasing.suppliers')) as S.SrvSupplier[];
  check('purchasing.suppliers', () => z.array(SupplierSchema).parse(suppliers.map(toSupplier)));

  const customers = (await call('naqsha_pos.api.crm.customers')) as S.SrvCustomer[];
  check('crm.customers', () => z.array(CustomerSchema).parse(customers.map(toCustomer)));

  if (customers[0]) {
    const history = (await call('naqsha_pos.api.crm.customer_history', {
      customer: customers[0].id,
    })) as S.SrvCustomerVisit[];
    check('crm.customer_history', () => z.array(CustomerVisitSchema).parse(history.map(toCustomerVisit)));
  } else {
    console.log('  – crm.customer_history        skipped (no customers)');
  }

  const pnl = (await call('naqsha_pos.api.reports.pnl', { period: 'month' })) as S.SrvPnl;
  check('reports.pnl', () => PnlReportSchema.parse(toPnlReport(pnl)));

  const perf = (await call('naqsha_pos.api.reports.item_performance', {
    period: 'month',
  })) as S.SrvItemPerformance;
  check('reports.item_performance', () => z.array(ItemPerfRowSchema).parse(toItemPerfRows(perf)));

  const branches = (await call('naqsha_pos.api.reports.branches', { period: 'month' })) as S.SrvBranches;
  check('reports.branches', () => z.array(BranchRowSchema).parse(toBranchRows(branches)));

  const attendance = (await call('naqsha_pos.api.staff.attendance')) as S.SrvAttendance;
  check('staff.attendance', () => z.array(AttendanceRowSchema).parse(toAttendanceRows(attendance)));

  const staffPerf = (await call('naqsha_pos.api.staff.performance', {
    period: 'month',
  })) as S.SrvStaffPerformance;
  check('staff.performance', () => z.array(StaffPerfRowSchema).parse(toStaffPerfRows(staffPerf)));

  const shifts = (await call('naqsha_pos.api.staff.shifts')) as S.SrvShifts;
  check('staff.shifts', () => z.array(ShiftRowSchema).parse(toShiftRows(shifts)));

  // Last month, not this one: slips for the current month are not cut until it ends,
  // so checking "now" would pass against an empty list and prove nothing.
  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const payroll = (await call('naqsha_pos.api.staff.payroll', {
    month: lastMonth.toISOString().slice(0, 10),
  })) as S.SrvPayroll;
  check('staff.payroll', () => PayrollSummarySchema.parse(toPayrollSummary(payroll)));

  // ---- Marketing & reservations -------------------------------------------
  // Scoped 'all' so an empty upcoming list cannot let a broken adapter pass.

  const campaigns = (await call('naqsha_pos.api.marketing.campaigns')) as S.SrvCampaign[];
  check('marketing.campaigns', () => z.array(CampaignSchema).parse(campaigns.map(toCampaign)));

  const coupons = (await call('naqsha_pos.api.marketing.coupons')) as S.SrvCoupon[];
  check('marketing.coupons', () => z.array(CouponSchema).parse(coupons.map(toCoupon)));

  const reservations = (await call('naqsha_pos.api.reservations.reservations', {
    scope: 'all',
  })) as S.SrvReservation[];
  check('reservations.reservations', () =>
    z.array(ReservationSchema).parse(reservations.map(toReservation)),
  );

  const waitlist = (await call('naqsha_pos.api.reservations.waitlist', {
    scope: 'all',
  })) as S.SrvWaitlistEntry[];
  check('reservations.waitlist', () =>
    z.array(WaitlistEntrySchema).parse(waitlist.map((r) => toWaitlistEntry(r))),
  );
}

void main();

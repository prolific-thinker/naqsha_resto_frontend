import type { AttendanceRow, PayrollSummary, ShiftRow, StaffPerfRow } from '@/types/erp';
import type { SrvAttendance, SrvPayroll, SrvShifts, SrvStaffPerformance } from '@/types/server';
import { dayShort, hhmm, rangeLabel } from './shared';

/** `staff.attendance` / `.performance` / `.shifts` / `.payroll` → view models. */

export function toAttendanceRows(raw: SrvAttendance): AttendanceRow[] {
  return raw.rows.map((row) => ({
    id: row.employee,
    employee: row.employeeName,
    role: row.role,
    status: row.status,
    inLabel: hhmm(row.inAt),
    outLabel: hhmm(row.outAt),
    // Surfaced so a manager knows whether they are looking at a payroll-grade
    // Attendance record or a clock-button checkin. They are not the same evidence.
    derived: row.source === 'checkin',
  }));
}

export function toStaffPerfRows(raw: SrvStaffPerformance): StaffPerfRow[] {
  return raw.rows.map((row, i) => ({
    rank: i + 1,
    name: row.employeeName,
    role: row.role,
    orders: row.orders,
    sales: row.sales,
    avgTicket: row.avgTicket,
  }));
}

export function toShiftRows(raw: SrvShifts): ShiftRow[] {
  return raw.rows.map((row) => ({
    id: row.ref,
    employee: row.employeeName,
    shiftType: row.shiftType,
    timeLabel:
      row.startTime && row.endTime ? `${row.startTime} – ${row.endTime}` : 'no shift times set',
    daysLabel: row.endDate
      ? `${dayShort(row.startDate)} – ${dayShort(row.endDate)}`
      : `from ${dayShort(row.startDate)}`,
  }));
}

export function toPayrollSummary(raw: SrvPayroll): PayrollSummary {
  return {
    periodLabel: rangeLabel(raw.fromDate, raw.toDate),
    totalNet: raw.totalNet,
    headcount: raw.headcount,
    rows: raw.rows.map((row) => ({
      id: row.slip,
      employee: row.employeeName,
      role: row.role,
      gross: row.gross,
      deductions: row.deductions,
      net: row.net,
      status: row.status,
    })),
  };
}

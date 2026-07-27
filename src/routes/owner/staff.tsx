import { useState } from 'react';
import { OwnerShell } from '@/components/layouts/OwnerShell';
import { Tabs } from '@/components/naqsha/Tabs';
import { StatTile } from '@/components/naqsha/StatTile';
import { Chip, type ChipVariant } from '@/components/naqsha/Chip';
import { DataRow } from '@/components/naqsha/DataRow';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { PeriodPicker } from '@/components/naqsha/PeriodPicker';
import { FormDialog, Field } from '@/components/naqsha/FormDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { money } from '@/lib/format';
import {
  useAttendance,
  useStaffPerformance,
  useShifts,
  usePayroll,
  useAssignShift,
  type Period,
} from '@/hooks/useErp';
import { isFailure } from '@/lib/api/http';
import type { AttendanceStatus, PayrollRow } from '@/types/erp';

const TABS = [
  { key: 'attendance', code: 'S-2', label: 'Attendance' },
  { key: 'performance', code: 'S-3', label: 'Performance' },
  { key: 'shifts', code: 'S-4', label: 'Shifts' },
  { key: 'payroll', code: 'S-5', label: 'Payroll' },
];

const ATT_CHIP: Record<AttendanceStatus, { variant: ChipVariant; label: string }> = {
  present: { variant: 'success', label: 'present' },
  absent: { variant: 'alert', label: 'absent' },
  half_day: { variant: 'amber', label: 'half day' },
  on_leave: { variant: 'muted', label: 'on leave' },
};
const PAY_CHIP: Record<PayrollRow['status'], ChipVariant> = {
  draft: 'muted',
  submitted: 'amber',
  paid: 'success',
};

// ---------------------------------------------------------------------------
// S-2 · Attendance
// ---------------------------------------------------------------------------

function AttendanceTab() {
  const { data, isLoading, isError, refetch } = useAttendance();
  if (isError) return <ErrorState label="attendance" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];
  const count = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length;
  const derived = rows.filter((r) => r.derived).length;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="On floor" value={String(count('present'))} delta={`of ${rows.length} staff`} deltaTone="up" />
        <StatTile label="On leave" value={String(count('on_leave'))} />
        <StatTile label="Absent" value={String(count('absent'))} deltaTone="down" />
        <StatTile label="Half day" value={String(count('half_day'))} />
      </div>

      {/* A clock-button checkin is not an approved Attendance record. Saying which is
          which stops a payroll conversation being had against the wrong evidence. */}
      {derived > 0 && (
        <p className="mb-3 font-mono text-[10px] uppercase tracking-ref text-muted">
          {derived} of {rows.length} rows derived from clock-in/out, not from an approved
          Attendance record
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState message="No active employees in this branch." />
      ) : (
        <>
          <DataRow header cols="1fr 130px 110px 110px 110px">
            <span>Employee</span>
            <span>Role</span>
            <span className="text-right">In</span>
            <span className="text-right">Out</span>
            <span className="text-right">Status</span>
          </DataRow>
          {rows.map((r) => (
            <DataRow key={r.id} cols="1fr 130px 110px 110px 110px">
              <span className="font-medium text-ink">{r.employee}</span>
              <span className="text-muted">{r.role || '—'}</span>
              <span className="text-right font-mono text-muted">{r.inLabel ?? '—'}</span>
              <span className="text-right font-mono text-muted">{r.outLabel ?? '—'}</span>
              <span className="flex justify-end">
                <Chip variant={ATT_CHIP[r.status].variant}>{ATT_CHIP[r.status].label}</Chip>
              </span>
            </DataRow>
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// S-3 · Performance
// ---------------------------------------------------------------------------

function PerformanceTab({ period }: { period: Period }) {
  const { data, isLoading, isError, refetch } = useStaffPerformance(period);
  if (isError) return <ErrorState label="staff performance" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];
  if (rows.length === 0) {
    return <EmptyState message="No invoices with a waiter recorded in this period." />;
  }

  return (
    <div>
      <DataRow header cols="50px 1fr 130px 100px 140px 130px">
        <span>#</span>
        <span>Employee</span>
        <span>Role</span>
        <span className="text-right">Orders</span>
        <span className="text-right">Sales</span>
        <span className="text-right">Avg ticket</span>
      </DataRow>
      {rows.map((r) => (
        <DataRow key={r.rank} cols="50px 1fr 130px 100px 140px 130px">
          <span className="font-mono font-semibold text-saffron">{r.rank}</span>
          <span className="font-medium text-ink">{r.name}</span>
          <span className="text-muted">{r.role || '—'}</span>
          <span className="text-right font-mono">{r.orders}</span>
          <span className="text-right font-mono font-semibold">₨ {money(r.sales)}</span>
          <span className="text-right font-mono text-muted">₨ {money(r.avgTicket)}</span>
        </DataRow>
      ))}
      <p className="mt-3 font-mono text-[10px] text-muted">
        From the waiter stamped on each submitted Sales Invoice.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// S-4 · Shifts
// ---------------------------------------------------------------------------

function ShiftsTab() {
  const { data, isLoading, isError, refetch } = useShifts();
  const { data: staff } = useAttendance();
  const [assigning, setAssigning] = useState(false);

  if (isError) return <ErrorState label="shifts" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setAssigning(true)}>
          + Assign shift
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState message="Nobody is rostered for today." />
      ) : (
        <>
          <DataRow header cols="1fr 130px 1fr 130px">
            <span>Employee</span>
            <span>Shift type</span>
            <span>Time</span>
            <span className="text-right">Dates</span>
          </DataRow>
          {rows.map((r) => (
            <DataRow key={r.id} cols="1fr 130px 1fr 130px">
              <span className="font-medium text-ink">{r.employee}</span>
              <span>
                <Chip variant="teal">{r.shiftType}</Chip>
              </span>
              <span className="font-mono text-[12px] text-muted">{r.timeLabel}</span>
              <span className="text-right text-muted">{r.daysLabel}</span>
            </DataRow>
          ))}
        </>
      )}

      {assigning && (
        <AssignShiftDialog
          people={(staff ?? []).map((s) => ({ id: s.id, name: s.employee }))}
          onClose={() => setAssigning(false)}
        />
      )}
    </div>
  );
}

function AssignShiftDialog({
  people,
  onClose,
}: {
  people: { id: string; name: string }[];
  onClose: () => void;
}) {
  const assign = useAssignShift();
  const today = new Date().toISOString().slice(0, 10);
  const [employee, setEmployee] = useState(people[0]?.id ?? '');
  const [shiftType, setShiftType] = useState('Evening');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!employee) return setError('Choose an employee.');
    assign.mutate(
      { employee, shiftType, startDate, endDate: endDate || undefined },
      {
        onSuccess: (res) => (isFailure(res) ? setError(res.message) : onClose()),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not assign the shift.'),
      },
    );
  };

  return (
    <FormDialog
      title="Assign shift"
      refCode="S-4 · Shift Assignment"
      submitLabel="Assign"
      onSubmit={submit}
      onClose={onClose}
      busy={assign.isPending}
      error={error}
      disabled={people.length === 0}
    >
      <Field label="Employee">
        <Select
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          options={people.map((p) => ({ value: p.id, label: p.name }))}
        />
      </Field>
      <Field label="Shift type">
        <Select
          value={shiftType}
          onChange={(e) => setShiftType(e.target.value)}
          options={[
            { value: 'Morning', label: 'Morning' },
            { value: 'Evening', label: 'Evening' },
          ]}
        />
      </Field>
      <Field label="From">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Field>
      <Field label="To" hint="blank = open ended">
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// S-5 · Payroll
// ---------------------------------------------------------------------------

/** Any date inside the month; the server derives the window from it. */
function monthsAgo(n: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

function PayrollTab() {
  const [offset, setOffset] = useState(1); // last month — this month has no slips yet
  const { data, isLoading, isError, refetch } = usePayroll(monthsAgo(offset));

  if (isError) return <ErrorState label="payroll" onRetry={() => void refetch()} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOffset((o) => o + 1)}>
          ← Earlier
        </Button>
        <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 1))}>
          Later →
        </Button>
      </div>

      {isLoading || !data ? (
        <Skeleton />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Net payroll" value={`₨ ${money(data.totalNet)}`} delta={data.periodLabel} />
            <StatTile label="Headcount" value={String(data.headcount)} />
            <StatTile label="Slips" value={String(data.rows.length)} delta="shown" />
          </div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-ref text-muted">
            Read-only — payroll runs &amp; approvals happen in ERPNext desk (Salary Slip / Payroll Entry)
          </p>
          {data.rows.length === 0 ? (
            <EmptyState message={`No salary slips for ${data.periodLabel}.`} />
          ) : (
            <>
              <DataRow header cols="1fr 130px 130px 130px 130px 100px">
                <span>Employee</span>
                <span>Role</span>
                <span className="text-right">Gross</span>
                <span className="text-right">Deductions</span>
                <span className="text-right">Net</span>
                <span className="text-right">Status</span>
              </DataRow>
              {data.rows.map((r) => (
                <DataRow key={r.id} cols="1fr 130px 130px 130px 130px 100px">
                  <span className="font-medium text-ink">{r.employee}</span>
                  <span className="text-muted">{r.role || '—'}</span>
                  <span className="text-right font-mono text-muted">₨ {money(r.gross)}</span>
                  <span className="text-right font-mono text-alert">− ₨ {money(r.deductions)}</span>
                  <span className="text-right font-mono font-semibold">₨ {money(r.net)}</span>
                  <span className="flex justify-end">
                    <Chip variant={PAY_CHIP[r.status]}>{r.status}</Chip>
                  </span>
                </DataRow>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-paper-3" />
      ))}
    </div>
  );
}

export default function OwnerStaff() {
  const [tab, setTab] = useState('attendance');
  const [period, setPeriod] = useState<Period>('week');

  return (
    <OwnerShell
      greet="Staff & HR"
      title="Team & payroll"
      lead="Frappe HR — attendance, performance, shifts and payroll"
      actions={tab === 'performance' ? <PeriodPicker value={period} onChange={setPeriod} /> : undefined}
      tabs={<Tabs tabs={TABS} active={tab} onChange={setTab} className="mt-6" />}
    >
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'performance' && <PerformanceTab period={period} />}
      {tab === 'shifts' && <ShiftsTab />}
      {tab === 'payroll' && <PayrollTab />}
    </OwnerShell>
  );
}

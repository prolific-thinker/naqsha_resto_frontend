import { useState } from 'react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Tabs } from '@/components/naqsha/Tabs';
import { Chip, type ChipVariant } from '@/components/naqsha/Chip';
import { DataRow } from '@/components/naqsha/DataRow';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { FormDialog, Field } from '@/components/naqsha/FormDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { isFailure } from '@/lib/api/http';
import {
  useReservations,
  useWaitlist,
  useSaveReservation,
  useSetReservationStatus,
  useAddWalkin,
  useSetWaitlistStatus,
  type ReservationScope,
} from '@/hooks/useErp';
import { useManagerTables } from '@/hooks/useOpenTables';
import type { Reservation, ReservationStatus, WaitlistEntry } from '@/types/erp';
import type { Table } from '@/types/domain';

const TABS = [
  { key: 'reservations', code: 'RES-1', label: 'Reservations' },
  { key: 'waitlist', code: 'RES-2', label: 'Waitlist' },
];

const RES_CHIP: Record<ReservationStatus, ChipVariant> = {
  booked: 'amber',
  seated: 'success',
  cancelled: 'muted',
  no_show: 'alert',
};
const WL_CHIP: Record<WaitlistEntry['status'], ChipVariant> = {
  waiting: 'amber',
  seated: 'success',
  left: 'muted',
};

const SCOPES: { key: ReservationScope; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'all', label: 'All' },
];

/** `<input type="datetime-local">` wants "YYYY-MM-DDTHH:mm" with no zone. */
function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Free tables, plus whatever this booking already holds so it stays selectable. */
function seatableTables(tables: Table[] | undefined, keep?: string): Table[] {
  return (tables ?? []).filter((t) => t.state === 'free' || t.ref === keep);
}

// ---------------------------------------------------------------------------
// Reservation form
// ---------------------------------------------------------------------------

function ReservationForm({
  existing,
  onClose,
}: {
  existing?: Reservation;
  onClose: () => void;
}) {
  const save = useSaveReservation();
  const { data: tables } = useManagerTables();
  const [error, setError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState(existing?.guestName ?? '');
  const [phone, setPhone] = useState(existing?.phone && existing.phone !== '—' ? existing.phone : '');
  const [partySize, setPartySize] = useState(String(existing?.partySize ?? 2));
  const [reservedAt, setReservedAt] = useState(toLocalInput(existing?.reservedAt));
  const [tableRef, setTableRef] = useState(existing?.tableRef ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const submit = async () => {
    setError(null);
    const res = await save.mutateAsync({
      reservation: existing?.ref,
      guestName,
      phone,
      partySize: Number(partySize) || 2,
      // Sent without a zone; the server reads it in site-local time, which is the
      // time the guest was actually given on the phone.
      reservedAt: reservedAt.replace('T', ' ') + ':00',
      tableRef: tableRef || null,
      notes,
    });
    if (isFailure(res)) {
      setError(res.message);
      return;
    }
    onClose();
  };

  return (
    <FormDialog
      title={existing ? `Edit ${existing.ref}` : 'New reservation'}
      refCode="RES-1"
      submitLabel={existing ? 'Save booking' : 'Book table'}
      onSubmit={() => void submit()}
      onClose={onClose}
      busy={save.isPending}
      error={error}
      disabled={!guestName.trim()}
    >
      <Field label="Guest name">
        <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Party size">
          <Input
            type="number"
            min="1"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            required
          />
        </Field>
        <Field label="When">
          <Input
            type="datetime-local"
            value={reservedAt}
            onChange={(e) => setReservedAt(e.target.value)}
            required
          />
        </Field>
      </div>
      <Field label="Table" hint="optional until seating">
        <Select
          value={tableRef}
          onChange={(e) => setTableRef(e.target.value)}
          options={[
            { value: '', label: 'No table yet' },
            ...seatableTables(tables, existing?.tableRef).map((t) => ({
              value: t.ref,
              label: `${t.ref} · ${t.seats ?? '?'} seats`,
            })),
          ]}
        />
      </Field>
      <Field label="Notes">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Seat dialog — shared by reservations and the waitlist
// ---------------------------------------------------------------------------

function SeatDialog({
  title,
  partySize,
  suggested,
  busy,
  error,
  onSeat,
  onClose,
}: {
  title: string;
  partySize: number;
  suggested?: string;
  busy: boolean;
  error: string | null;
  onSeat: (table: string) => void;
  onClose: () => void;
}) {
  const { data: tables } = useManagerTables();
  const free = seatableTables(tables, suggested);
  const [table, setTable] = useState(suggested ?? '');

  return (
    <FormDialog
      title={title}
      refCode="RES-1"
      submitLabel="Seat party"
      onSubmit={() => onSeat(table)}
      onClose={onClose}
      busy={busy}
      error={error}
      disabled={!table}
    >
      <p className="text-[13px] text-muted">
        Seating opens the table for {partySize} {partySize === 1 ? 'cover' : 'covers'} so the
        waiter can start taking the order.
      </p>
      <Field label="Table">
        <Select
          value={table}
          onChange={(e) => setTable(e.target.value)}
          options={[
            { value: '', label: 'Choose a table…' },
            ...free.map((t) => ({
              value: t.ref,
              label:
                `${t.ref} · ${t.seats ?? '?'} seats` +
                (t.seats && t.seats < partySize ? ' · too small' : ''),
            })),
          ]}
        />
      </Field>
      {free.length === 0 && (
        <p className="text-[12px] text-alert">Every table is occupied right now.</p>
      )}
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// Reservations tab
// ---------------------------------------------------------------------------

function ReservationsTab() {
  const [scope, setScope] = useState<ReservationScope>('upcoming');
  const { data, isLoading, isError, refetch } = useReservations(scope);
  const setStatus = useSetReservationStatus();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [seating, setSeating] = useState<Reservation | null>(null);
  const [seatError, setSeatError] = useState<string | null>(null);

  const seat = async (table: string) => {
    if (!seating) return;
    setSeatError(null);
    const res = await setStatus.mutateAsync({
      reservation: seating.ref,
      status: 'seated',
      tableRef: table,
      pax: seating.partySize,
    });
    if (isFailure(res)) {
      setSeatError(res.message);
      return;
    }
    setSeating(null);
  };

  const mark = (reservation: string, status: ReservationStatus) =>
    setStatus.mutate({ reservation, status });

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={scope === s.key}
              onClick={() => setScope(s.key)}
              className={
                scope === s.key
                  ? 'rounded border border-ink bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-ref text-paper'
                  : 'rounded border border-line bg-paper-3 px-3 py-1.5 font-mono text-[11px] uppercase tracking-ref text-muted'
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          + New reservation
        </Button>
      </div>

      {isError ? (
        <ErrorState label="reservations" onRetry={() => void refetch()} />
      ) : isLoading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <EmptyState message="No reservations booked." />
      ) : (
        <>
          <DataRow header cols="130px 1fr 130px 140px 60px 300px">
            <span>Ref</span>
            <span>Guest</span>
            <span>Phone</span>
            <span>When</span>
            <span className="text-right">Party</span>
            <span className="text-right">Table / status</span>
          </DataRow>
          {rows.map((r) => (
            <DataRow key={r.ref} cols="130px 1fr 130px 140px 60px 300px">
              <span className="font-mono text-[11px] text-muted">{r.ref}</span>
              <button
                type="button"
                onClick={() => setEditing(r)}
                className="truncate text-left font-medium text-ink hover:underline"
              >
                {r.guestName}
              </button>
              <span className="font-mono text-[12px] text-muted">{r.phone}</span>
              <span className="text-[12.5px] text-ink">{r.reservedAtLabel}</span>
              <span className="text-right font-mono">{r.partySize}</span>
              <span className="flex items-center justify-end gap-2">
                {r.tableRef && (
                  <span className="font-mono text-[11px] text-muted">{r.tableRef}</span>
                )}
                <Chip variant={RES_CHIP[r.status]}>{r.status.replace('_', ' ')}</Chip>
                {r.status === 'booked' && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => setSeating(r)}>
                      Seat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => mark(r.ref, 'no_show')}
                      title="Mark as a no-show"
                    >
                      No-show
                    </Button>
                  </>
                )}
                {(r.status === 'no_show' || r.status === 'cancelled') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => mark(r.ref, 'booked')}
                    title="Put this booking back on the list"
                  >
                    Re-book
                  </Button>
                )}
              </span>
            </DataRow>
          ))}
        </>
      )}

      {creating && <ReservationForm onClose={() => setCreating(false)} />}
      {editing && <ReservationForm existing={editing} onClose={() => setEditing(null)} />}
      {seating && (
        <SeatDialog
          title={`Seat ${seating.guestName}`}
          partySize={seating.partySize}
          suggested={seating.tableRef}
          busy={setStatus.isPending}
          error={seatError}
          onSeat={(t) => void seat(t)}
          onClose={() => {
            setSeating(null);
            setSeatError(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waitlist tab
// ---------------------------------------------------------------------------

function WalkinForm({ onClose }: { onClose: () => void }) {
  const add = useAddWalkin();
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [quotedWaitMin, setQuotedWaitMin] = useState('15');

  const submit = async () => {
    setError(null);
    const res = await add.mutateAsync({
      guestName,
      phone,
      partySize: Number(partySize) || 2,
      quotedWaitMin: Number(quotedWaitMin) || 0,
    });
    if (isFailure(res)) {
      setError(res.message);
      return;
    }
    onClose();
  };

  return (
    <FormDialog
      title="Add walk-in"
      refCode="RES-2"
      submitLabel="Add to waitlist"
      onSubmit={() => void submit()}
      onClose={onClose}
      busy={add.isPending}
      error={error}
      disabled={!guestName.trim()}
    >
      <Field label="Guest name">
        <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
      </Field>
      <Field label="Phone" hint="so they can be called back">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Party size">
          <Input
            type="number"
            min="1"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            required
          />
        </Field>
        <Field label="Quoted wait" hint="minutes">
          <Input
            type="number"
            min="0"
            value={quotedWaitMin}
            onChange={(e) => setQuotedWaitMin(e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}

function WaitlistTab() {
  const { data, isLoading, isError, refetch } = useWaitlist('today');
  const setStatus = useSetWaitlistStatus();
  const [adding, setAdding] = useState(false);
  const [seating, setSeating] = useState<WaitlistEntry | null>(null);
  const [seatError, setSeatError] = useState<string | null>(null);

  const seat = async (table: string) => {
    if (!seating) return;
    setSeatError(null);
    const res = await setStatus.mutateAsync({
      entry: seating.ref,
      status: 'seated',
      tableRef: table,
    });
    if (isFailure(res)) {
      setSeatError(res.message);
      return;
    }
    setSeating(null);
  };

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
          + Add walk-in
        </Button>
      </div>

      {isError ? (
        <ErrorState label="waitlist" onRetry={() => void refetch()} />
      ) : isLoading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <EmptyState message="Waitlist is empty." />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((w) => {
            // Past the quote is the number that matters: this is the party about to
            // give up and leave.
            const over = w.status === 'waiting' && w.waitingMin > w.quotedWaitMin;
            return (
              <div
                key={w.ref}
                className={
                  'flex flex-wrap items-center justify-between gap-3 rounded-md border bg-paper-2 px-5 py-3 ' +
                  (over ? 'border-alert/50' : 'border-line')
                }
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{w.guestName}</span>
                    <span className="font-mono text-[11px] text-muted">party {w.partySize}</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted">
                    {w.phone} · joined {w.joinedLabel}
                    {w.tableRef && ` · ${w.tableRef}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={'font-mono text-[12px] ' + (over ? 'text-alert' : 'text-amber')}>
                    {w.status === 'waiting'
                      ? `${w.waitingMin} min of ~${w.quotedWaitMin}`
                      : `~${w.quotedWaitMin} min quoted`}
                  </span>
                  <Chip variant={WL_CHIP[w.status]}>{w.status}</Chip>
                  {w.status === 'waiting' && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => setSeating(w)}>
                        Seat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus.mutate({ entry: w.ref, status: 'left' })}
                      >
                        Left
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && <WalkinForm onClose={() => setAdding(false)} />}
      {seating && (
        <SeatDialog
          title={`Seat ${seating.guestName}`}
          partySize={seating.partySize}
          busy={setStatus.isPending}
          error={seatError}
          onSeat={(t) => void seat(t)}
          onClose={() => {
            setSeating(null);
            setSeatError(null);
          }}
        />
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded bg-paper-3" />
      ))}
    </div>
  );
}

export default function ManagerReservations() {
  const [tab, setTab] = useState('reservations');
  return (
    <ManagerShell title="Reservations & waitlist" refCode="RES-01">
      <div className="border-b border-line bg-paper-2 px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="border-b-0" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === 'reservations' ? <ReservationsTab /> : <WaitlistTab />}
      </div>
    </ManagerShell>
  );
}

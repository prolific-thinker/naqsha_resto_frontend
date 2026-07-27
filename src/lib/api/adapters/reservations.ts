import type { Reservation, WaitlistEntry } from '@/types/erp';
import type { SrvReservation, SrvWaitlistEntry } from '@/types/server';
import { hhmm, opt, sinceSeconds, whenLabel } from './shared';

export function toReservation(raw: SrvReservation): Reservation {
  return {
    ref: raw.ref,
    guestName: raw.guestName,
    phone: raw.phone ?? '—',
    customer: opt(raw.customer),
    tableRef: opt(raw.tableRef),
    reservedAt: raw.reservedAt,
    reservedAtLabel: whenLabel(raw.reservedAt),
    partySize: raw.partySize ?? 0,
    status: raw.status,
    notes: opt(raw.notes),
  };
}

export function toWaitlistEntry(raw: SrvWaitlistEntry, now: number = Date.now()): WaitlistEntry {
  // How long they have actually waited, against what they were quoted. The door needs
  // the comparison, not the promise — a party 25 minutes into a 10-minute quote is the
  // one about to walk out.
  const waitedSeconds = sinceSeconds(raw.joinedAt, now) ?? 0;

  return {
    ref: raw.ref,
    guestName: raw.guestName,
    phone: raw.phone ?? '—',
    partySize: raw.partySize ?? 0,
    quotedWaitMin: raw.quotedWaitMin ?? 0,
    status: raw.status,
    joinedAt: raw.joinedAt,
    joinedLabel: hhmm(raw.joinedAt) ?? '—',
    tableRef: opt(raw.tableRef),
    waitingMin: Math.max(0, Math.floor(waitedSeconds / 60)),
  };
}

import { pkr } from '@/lib/format';
import type { Table, KotProgress, ChipTone } from '@/types/domain';
import type { SrvTable, SrvTableKot } from '@/types/server';
import { hhmm, opt, optNum, plural } from './shared';

/** `floor.tables` → `TableSchema`. */

/**
 * KOT state → the three-value progress pip the card renders.
 *
 * `breach → 'prep'` is deliberate: a breached table is already red via its own
 * state, and PROGRESS_STYLE has no alert colour, so mapping it anywhere else just
 * loses the "still cooking" information.
 */
const PIP: Record<SrvTableKot['state'], KotProgress | null> = {
  queued: 'pending',
  preparing: 'prep',
  breach: 'prep',
  prepared: 'done',
  voided: null,
};

const STATUS_TAG: Record<string, { label: string; tone: ChipTone }> = {
  active: { label: 'Prep', tone: 'amber' },
  breach: { label: 'Late', tone: 'alert' },
  ready: { label: 'Ready', tone: 'success' },
  billing: { label: 'Billing', tone: 'teal' },
  feedback: { label: 'Feedback', tone: 'amber' },
};

const ACTION_TAG: Record<string, string> = {
  ready: '→ DISPATCH WAITER',
  breach: '→ ESCALATE',
  billing: '→ TAKE PAYMENT',
};

function pips(kots: SrvTableKot[]): KotProgress[] | undefined {
  // Server order is `creation asc`, so the bar reads left-to-right in fire order.
  const out = kots.map((k) => PIP[k.state]).filter((p): p is KotProgress => p !== null);
  return out.length ? out : undefined;
}

function metaLine(raw: SrvTable, progress: KotProgress[] | undefined): string | undefined {
  const waiterName = raw.waiter ?? undefined;

  if (raw.state === 'free') return raw.seats ? `${raw.seats}-top` : undefined;
  if (raw.state === 'breach') return `${waiterName ?? 'Unassigned'} · SLA breach`;
  if (raw.state === 'ready') return 'All prepared · dispatch';
  if (raw.state === 'billing') return `${pkr(raw.runningAmount)} · billing`;

  const prep = progress?.filter((p) => p === 'prep').length ?? 0;
  const done = progress?.filter((p) => p === 'done').length ?? 0;
  const pending = progress?.filter((p) => p === 'pending').length ?? 0;

  if (prep) return `${prep} ${plural(prep, 'KOT')} preparing`;
  if (done) return 'All prepared';
  if (pending) return `${pending} ${plural(pending, 'KOT')} queued`;

  return raw.activePax ? `${raw.activePax} pax` : 'seated';
}

export function toTable(raw: SrvTable): Table {
  const progress = pips(raw.kots ?? []);

  return {
    ref: raw.ref,
    number: raw.number,
    // `mine` is a DISPLAY state, never a stored one — floor.py::tables says so
    // explicitly. Storage holds `occupied`; the server tells us `isMine` per
    // requesting user and we render the difference.
    state: raw.state === 'occupied' && raw.isMine ? 'mine' : raw.state,
    // Carried through as well as folded into `state`. The fold is lossy — a table
    // that is both mine and cooking renders as `active` — and "My tables" needs the
    // ownership fact, not the display state.
    isMine: !!raw.isMine,
    seats: opt(raw.seats),
    // The server sends employee_name as a plain string, not {id,name}. There is no
    // employee id on this payload, so the card shows the name and nothing else.
    waiter: raw.waiter ? { id: '', name: raw.waiter } : undefined,
    meta: metaLine(raw, progress),
    pax: optNum(raw.activePax),
    amount: optNum(raw.runningAmount),
    openedAtLabel: hhmm(raw.openedAt),
    openedAt: opt(raw.openedAt),
    kots: progress,
    actionTag: ACTION_TAG[raw.state],
    // Computed from the STORED state, so a table that is both mine and cooking
    // still reads "Prep".
    statusTag: STATUS_TAG[raw.state],
  };
}

export function toTableList(rows: SrvTable[]): Table[] {
  return rows.map(toTable);
}

import { z } from 'zod';
import { startOfWeek } from 'date-fns';
import type { Wastage } from '@/types/domain';
import { WastageCountsSchema, WastageSchema, WastageWeekSchema } from '@/types/api';
import { apiGet, resourceList, unwrapOk } from './http';
import { METHODS, RESOURCE } from './endpoints';
import { REASON_LABEL, whenLabel } from './adapters';
import type { SrvWastageCounts, SrvWastageSummary } from '@/types/server';

/**
 * Wastage reads.
 *
 * There is no `naqsha_pos.api.wastage.pending` method — by design, the write side is
 * `/api/resource/Wastage Entry` plus `frappe.model.workflow.apply_workflow`, because
 * the Frappe Workflow is the enforcement and a custom method would be a way round it.
 * So the approval queue is assembled here from resource reads.
 */

type RawEntry = {
  name: string;
  reason: string;
  note: string | null;
  total_value: number;
  reported_by: string | null;
  reported_at: string | null;
  workflow_state: string | null;
};

type RawItem = {
  parent: string;
  item: string;
  item_code: string | null;
  qty: number;
  uom: string | null;
  rate: number;
  amount: number;
};

const STATUS_OF: Record<string, Wastage['status']> = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Draft: 'pending',
};

function severityTag(totalValue: number, reason: string): Wastage['tag'] {
  if (totalValue >= 500) return { label: 'high value', tone: 'alert' };
  if (reason === 'refused') return { label: 'customer', tone: 'muted' };
  return { label: 'routine', tone: 'amber' };
}

export async function getPendingApprovals(): Promise<Wastage[]> {
  const entries = await resourceList<RawEntry>(RESOURCE.wastageEntry, {
    filters: [['workflow_state', '=', 'Pending']],
    fields: ['name', 'reason', 'note', 'total_value', 'reported_by', 'reported_at', 'workflow_state'],
    order_by: 'reported_at desc',
  });
  if (!entries.length) return [];

  const names = entries.map((e) => e.name);

  // `parent` is REQUIRED when listing a child DocType — without it permission
  // resolution has no parent doctype to check against.
  const [items, evidence, employees] = await Promise.all([
    resourceList<RawItem>(RESOURCE.wastageItem, {
      filters: [['parent', 'in', names]],
      fields: ['parent', 'item', 'item_code', 'qty', 'uom', 'rate', 'amount'],
      parent: RESOURCE.wastageEntry,
    }),
    resourceList<{ parent: string }>(RESOURCE.wastageEvidence, {
      filters: [['parent', 'in', names]],
      fields: ['parent'],
      parent: RESOURCE.wastageEntry,
    }),
    resourceList<{ name: string; employee_name: string }>(RESOURCE.employee, {
      filters: [['name', 'in', entries.map((e) => e.reported_by).filter(Boolean)]],
      fields: ['name', 'employee_name'],
    }),
  ]);

  const employeeName = new Map(employees.map((e) => [e.name, e.employee_name]));
  const evidenceCount = evidence.reduce<Map<string, number>>(
    (m, e) => m.set(e.parent, (m.get(e.parent) ?? 0) + 1),
    new Map(),
  );

  const rows: Wastage[] = entries.map((e) => ({
    ref: e.name,
    reason: e.reason as Wastage['reason'],
    reasonLabel: REASON_LABEL[e.reason] ?? e.reason,
    note: e.note ?? undefined,
    items: items
      .filter((i) => i.parent === e.name)
      .map((i) => ({
        // The child row carries `item` (Link) and `item_code` (Data) but no item_name.
        name: i.item_code ?? i.item,
        code: i.item_code ?? i.item,
        qty: i.qty,
        uom: i.uom ?? 'nos',
        rate: i.rate,
        amount: i.amount,
      })),
    totalValue: e.total_value,
    managerLabel: e.reported_by
      ? `${employeeName.get(e.reported_by) ?? e.reported_by}`
      : 'Unknown',
    reportedAtLabel: whenLabel(e.reported_at),
    evidenceCount: evidenceCount.get(e.name) ?? 0,
    status: STATUS_OF[e.workflow_state ?? 'Draft'] ?? 'pending',
    tag: severityTag(e.total_value, e.reason),
  }));

  return z.array(WastageSchema).parse(rows);
}

export async function getApprovalCounts() {
  const raw = await apiGet<SrvWastageCounts>(METHODS.wastageCounts);
  const c = unwrapOk(raw);
  return WastageCountsSchema.parse({
    pending: c.pending,
    approved: c.approved,
    rejected: c.rejected,
  });
}

/**
 * `wastage.summary` returns one total across every submitted entry, and since the
 * workflow gives Pending `doc_status 1` that total includes pending ones — so it
 * cannot supply the approved/pending split this card needs. Derived from a resource
 * read instead, with the method's own total kept as a cross-check.
 */
export async function getWeekSummary() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [summaryRaw, entries] = await Promise.all([
    apiGet<SrvWastageSummary>(METHODS.wastageSummary, { query: { range: 'week' } }),
    resourceList<{ workflow_state: string | null; total_value: number }>(RESOURCE.wastageEntry, {
      filters: [
        ['reported_at', '>=', weekStart.toISOString().slice(0, 10)],
        ['docstatus', '!=', 2],
      ],
      fields: ['workflow_state', 'total_value'],
    }),
  ]);

  const summary = unwrapOk(summaryRaw);
  const sum = (state: string) =>
    entries.filter((e) => e.workflow_state === state).reduce((t, e) => t + (e.total_value ?? 0), 0);

  return WastageWeekSchema.parse({
    rangeLabel: `${summary.entryCount} ${summary.entryCount === 1 ? 'entry' : 'entries'} this week`,
    approvedValue: sum('Approved'),
    pendingValue: sum('Pending'),
  });
}

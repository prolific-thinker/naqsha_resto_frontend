import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/mutations';
import { isFailure } from '@/lib/api/http';
import type { CartLine, KdsBoard, Kot } from '@/types/domain';

/**
 * Write hooks.
 *
 * Optimism is applied deliberately, not by default: only `advanceKot` is optimistic,
 * because a wall display touched with wet hands cannot wait 200 ms for a card to move.
 * Everything that moves money or fires tickets waits for the server — an order that
 * appears on the floor before the kitchen has it is a lie the kitchen pays for.
 */

export function useOpenTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { table: string; pax: number }) => api.openTable(vars.table, vars.pax),
    onSettled: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useDispatchTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (table: string) => api.dispatchTable(table),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['tables'] });
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
    },
  });
}

/**
 * Manager escalates a ticket to a station.
 *
 * Deliberately not optimistic. The entire point of the action is that a message reached
 * the kitchen; painting the card as escalated before the server confirmed would tell the
 * manager the bar had been chased when it had not.
 */
export function useEscalateKot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { kot: string; note?: string; station?: string }) =>
      api.escalateKot(vars.kot, vars.note),
    onSettled: (_res, _err, vars) => {
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
      if (vars.station) void qc.invalidateQueries({ queryKey: ['kds', vars.station] });
    },
  });
}

export function useSubmitOrder() {
  const qc = useQueryClient();
  return useMutation({
    // `offlineRef` arrives in variables, so a TanStack retry reuses the same key and
    // the server dedupes it. Generating one in here would defeat that.
    mutationFn: (vars: {
      table: string;
      pax: number;
      lines: CartLine[];
      offlineRef: string;
      hasOpenOrder: boolean;
    }) => api.submitOrder(vars),
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['tables'] });
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
      res.kots?.forEach((k) => qc.invalidateQueries({ queryKey: ['kds', k.station] }));
    },
  });
}

export function useAdvanceKot(station: string) {
  const qc = useQueryClient();
  const key = ['kds', station];

  return useMutation({
    mutationFn: (vars: { kot: string; to: 'preparing' | 'prepared' }) => api.advanceKot(vars.kot, vars.to),

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<KdsBoard>(key);
      if (!previous) return { previous };

      const all = [...previous.queue, ...previous.active, ...previous.prepared];
      const target = all.find((k) => k.ref === vars.kot);
      if (!target) return { previous };

      const now = new Date().toISOString();
      const moved: Kot = {
        ...target,
        state: vars.to,
        receivedAt: vars.to === 'preparing' ? now : target.receivedAt,
      };
      const rest = all.filter((k) => k.ref !== vars.kot);

      qc.setQueryData<KdsBoard>(key, {
        ...previous,
        queue: rest.filter((k) => k.state === 'queued'),
        active: [...rest.filter((k) => k.state === 'preparing' || k.state === 'breach'),
          ...(vars.to === 'preparing' ? [moved] : [])],
        prepared: [...(vars.to === 'prepared' ? [moved] : []), ...rest.filter((k) => k.state === 'prepared')],
      });

      return { previous };
    },

    onSuccess: (res, _vars, ctx) => {
      // ILLEGAL_TRANSITION arrives as HTTP 200, so onError never fires for it. Roll
      // the optimistic move back SILENTLY — kds.py returns this code precisely
      // because tablets get double-tapped, and a toast would punish the user for it.
      if (isFailure(res) && ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
      void qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function usePayInvoice(tableRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      invoice: string;
      payments: { mode: string; amount: number; reference?: string }[];
      offlineRef: string;
    }) => api.payInvoice(vars),
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['invoice', tableRef] });
      void qc.invalidateQueries({ queryKey: ['tables'] });
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
    },
  });
}

export function useToggle86() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { item: string; is86: boolean; reason?: string }) =>
      api.toggle86(vars.item, vars.is86, vars.reason),
    onSettled: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useSubmitWastage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draft: api.WastageDraft) => api.submitWastage(draft),
    // Wastage Entry has no offline_ref, so a retried insert creates a duplicate.
    retry: 0,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wastage'] });
    },
  });
}

export function useDecideWastage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; action: 'Approve' | 'Reject' }) =>
      api.decideWastage(vars.name, vars.action),
    retry: 0,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['wastage'] });
      // Approved wastage feeds the owner dashboard's wastageValue.
      void qc.invalidateQueries({ queryKey: ['owner'] });
    },
  });
}

/**
 * Adjust a draft bill: discount, service charge, or attaching the guest for loyalty.
 *
 * Attaching a phone at billing time is the whole reason `_reassign_customer` exists
 * server-side — a table opens anonymously and the guest identifies themselves when
 * they pay. Until now there was no UI for it, so the capability was unreachable.
 */
export function useUpdateInvoice(tableRef: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof api.updateInvoice>[0]) => api.updateInvoice(vars),
    // Editing a draft invoice is not idempotent-keyed; a retry would re-apply.
    retry: 0,
    onSuccess: (res) => {
      if (isFailure(res)) return;
      void qc.invalidateQueries({ queryKey: ['invoice', tableRef] });
      void qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

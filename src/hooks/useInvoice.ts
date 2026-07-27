import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getInvoice, openInvoice, type InvoiceContext } from '@/lib/api/pos';
import { getManagerTables, getMenuItems } from '@/lib/api/orders';
import { subscribe } from '@/lib/realtime/socket';
import type { MenuItem, PosInvoice, Station, Table } from '@/types/domain';

/**
 * The invoice payload carries no per-line station and no session start, so both are
 * joined from caches the app already holds.
 */
async function invoiceContext(qc: QueryClient, tableRef: string): Promise<InvoiceContext> {
  const [items, tables] = await Promise.all([
    qc.ensureQueryData<MenuItem[]>({ queryKey: ['menu', 'items'], queryFn: getMenuItems }),
    qc.ensureQueryData<Table[]>({ queryKey: ['tables', 'manager'], queryFn: getManagerTables }),
  ]);

  const stationByCode = new Map<string, Station>(items.map((i) => [i.id, i.station]));
  const openedAt = tables.find((t) => t.ref === tableRef)?.openedAt ?? null;
  return { stationByCode, openedAt };
}

/**
 * The bill for a table.
 *
 * A pure read now that `open_invoice` owns creating the draft, so refetching it is
 * harmless. Still not polled — a bill nobody is looking at is not worth a request. It
 * refetches on `naqsha:invoice_update` for this table, or when the user acts.
 */
export function useInvoice(tableRef: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['invoice', tableRef],
    enabled: Boolean(tableRef),
    queryFn: async () => getInvoice(tableRef, await invoiceContext(qc, tableRef)),
  });

  useEffect(() => {
    const unsubscribe = subscribe(`invoice:${tableRef}`, () => {
      void qc.invalidateQueries({ queryKey: ['invoice', tableRef] });
    });
    return unsubscribe;
  }, [tableRef, qc]);

  return query;
}

/**
 * Open the bill for a table: creates the draft invoice and moves the table to
 * `billing`. The result is written straight into the invoice cache so the screen
 * flips to the bill without a second round trip.
 */
export function useOpenInvoice(tableRef: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<PosInvoice> =>
      openInvoice(tableRef, await invoiceContext(qc, tableRef)),
    onSuccess: (inv) => {
      qc.setQueryData(['invoice', tableRef], inv);
      // The table has moved to `billing`, so the floor and its counts are now stale.
      void qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

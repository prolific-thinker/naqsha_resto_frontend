import { z } from 'zod';
import type { AggregateRow, KdsBoard, Kot, Station } from '@/types/domain';
import { AggregateRowSchema, KdsBoardSchema } from '@/types/api';
import { apiGet, unwrapOk } from './http';
import { METHODS } from './endpoints';
import { toAggregateRow, toKdsBoard } from './adapters';
import type { SrvAggregateRow, SrvKdsBoard } from '@/types/server';

export async function getKdsBoard(station: Station): Promise<KdsBoard> {
  const raw = await apiGet<SrvKdsBoard>(METHODS.kdsBoard, { query: { station } });
  return KdsBoardSchema.parse(toKdsBoard(unwrapOk(raw)));
}

/**
 * Aggregate rows, sorted ready → breach → normal.
 *
 * The sort stays client-side: the server orders by readiness ratio then age and does
 * not lift breach above normal, which is what the screen's "Sort: readiness" chip
 * implies.
 *
 * `boards` supplies the real item names and per-station timings that the aggregate
 * payload does not carry (it sends only `{station, state}` per KOT). The caller
 * passes whatever station boards are already in the query cache; without them each
 * line degrades to a ticket count, which is honest rather than wrong.
 */
export async function getAggregateRows(
  boards?: Map<string, Map<string, Kot[]>>,
): Promise<AggregateRow[]> {
  const raw = await apiGet<SrvAggregateRow[]>(METHODS.kdsAggregate);
  const rows = unwrapOk(raw).map((r) => toAggregateRow(r, boards?.get(r.tableRef)));

  const order = { ready: 0, breach: 1, normal: 2 } as const;
  return z
    .array(AggregateRowSchema)
    .parse([...rows].sort((a, b) => order[a.rowState] - order[b.rowState]));
}

import { z } from 'zod';
import type { AggregateRow, KdsBoard, Station } from '@/types/domain';
import { AggregateRowSchema, KdsBoardSchema } from '@/types/api';
import { mockGet } from './client';
import { httpGet, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
import { AGGREGATE_ROWS, KDS_BOARDS } from '@/lib/mocks/kots';

export function getKdsBoard(station: Station): Promise<KdsBoard> {
  return USE_MOCKS
    ? mockGet(KdsBoardSchema, KDS_BOARDS[station])
    : httpGet(ENDPOINTS.kdsBoard(station), KdsBoardSchema);
}

/** Aggregate rows sorted by readiness (ready first, then breach, then normal). */
export async function getAggregateRows(): Promise<AggregateRow[]> {
  const schema = z.array(AggregateRowSchema);
  const rows = USE_MOCKS
    ? await mockGet(schema, AGGREGATE_ROWS)
    : await httpGet(ENDPOINTS.kdsAggregate(), schema);
  const order = { ready: 0, breach: 1, normal: 2 } as const;
  return [...rows].sort((a, b) => order[a.rowState] - order[b.rowState]);
}

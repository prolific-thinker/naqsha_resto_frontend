import { z } from 'zod';
import type { AggregateRow, KdsBoard, Station } from '@/types/domain';
import { AggregateRowSchema, KdsBoardSchema } from '@/types/api';
import { mockGet } from './client';
import { AGGREGATE_ROWS, KDS_BOARDS } from '@/lib/mocks/kots';

export function getKdsBoard(station: Station): Promise<KdsBoard> {
  return mockGet(KdsBoardSchema, KDS_BOARDS[station]);
}

/** Aggregate rows sorted by readiness (ready first, then breach, then normal). */
export function getAggregateRows(): Promise<AggregateRow[]> {
  const order = { ready: 0, breach: 1, normal: 2 } as const;
  const sorted = [...AGGREGATE_ROWS].sort((a, b) => order[a.rowState] - order[b.rowState]);
  return mockGet(z.array(AggregateRowSchema), sorted);
}

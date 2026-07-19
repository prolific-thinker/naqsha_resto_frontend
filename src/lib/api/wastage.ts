import { z } from 'zod';
import type { Wastage } from '@/types/domain';
import { WastageCountsSchema, WastageSchema, WastageWeekSchema } from '@/types/api';
import { mockGet } from './client';
import { httpGet, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
import { WASTAGE_APPROVALS, WASTAGE_COUNTS, WASTAGE_WEEK } from '@/lib/mocks/wastage';

export function getPendingApprovals(): Promise<Wastage[]> {
  const schema = z.array(WastageSchema);
  return USE_MOCKS ? mockGet(schema, WASTAGE_APPROVALS) : httpGet(ENDPOINTS.wastagePending(), schema);
}

export function getApprovalCounts() {
  return USE_MOCKS
    ? mockGet(WastageCountsSchema, WASTAGE_COUNTS)
    : httpGet(ENDPOINTS.wastageCounts(), WastageCountsSchema);
}

export function getWeekSummary() {
  return USE_MOCKS
    ? mockGet(WastageWeekSchema, WASTAGE_WEEK)
    : httpGet(ENDPOINTS.wastageWeek(), WastageWeekSchema);
}

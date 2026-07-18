import { z } from 'zod';
import type { Wastage } from '@/types/domain';
import { WastageSchema } from '@/types/api';
import { mockGet } from './client';
import { WASTAGE_APPROVALS, WASTAGE_COUNTS, WASTAGE_WEEK } from '@/lib/mocks/wastage';

export function getPendingApprovals(): Promise<Wastage[]> {
  return mockGet(z.array(WastageSchema), WASTAGE_APPROVALS);
}

export function getApprovalCounts(): Promise<typeof WASTAGE_COUNTS> {
  return Promise.resolve(WASTAGE_COUNTS);
}

export function getWeekSummary(): Promise<typeof WASTAGE_WEEK> {
  return Promise.resolve(WASTAGE_WEEK);
}

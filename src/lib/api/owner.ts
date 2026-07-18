import type { OwnerDashboard } from '@/types/domain';
import { OwnerDashboardSchema } from '@/types/api';
import { mockGet } from './client';
import { OWNER_DASHBOARD } from '@/lib/mocks/owner-stats';

export function getOwnerDashboard(): Promise<OwnerDashboard> {
  return mockGet(OwnerDashboardSchema, OWNER_DASHBOARD);
}

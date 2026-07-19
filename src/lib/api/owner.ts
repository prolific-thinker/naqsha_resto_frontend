import type { OwnerDashboard } from '@/types/domain';
import { OwnerDashboardSchema } from '@/types/api';
import { mockGet } from './client';
import { httpGet, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
import { OWNER_DASHBOARD } from '@/lib/mocks/owner-stats';

export function getOwnerDashboard(): Promise<OwnerDashboard> {
  return USE_MOCKS
    ? mockGet(OwnerDashboardSchema, OWNER_DASHBOARD)
    : httpGet(ENDPOINTS.ownerDashboard(), OwnerDashboardSchema);
}

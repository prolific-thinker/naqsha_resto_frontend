import type { OwnerDashboard } from '@/types/domain';
import { OwnerDashboardSchema } from '@/types/api';
import { apiGet, unwrapOk } from './http';
import { METHODS } from './endpoints';
import { toOwnerDashboard, type OwnerContext } from './adapters/owner';
import type { SrvOwnerDashboard } from '@/types/server';

export async function getOwnerDashboard(
  ctx: OwnerContext,
  period: 'day' | 'week' | 'month' = 'day',
): Promise<OwnerDashboard> {
  const raw = await apiGet<SrvOwnerDashboard>(METHODS.ownerDashboard, { query: { period } });
  return OwnerDashboardSchema.parse(toOwnerDashboard(unwrapOk(raw), ctx));
}

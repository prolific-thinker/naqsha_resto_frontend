import { useQuery } from '@tanstack/react-query';
import { apiGet, unwrapOk } from '@/lib/api/http';
import { METHODS } from '@/lib/api/endpoints';
import type { NavBadge } from '@/components/layouts/navConfig';
import type { Role } from '@/types/domain';
import type { SrvFloorStats } from '@/types/server';

/**
 * Live sidebar badge counts, keyed by `NavItem.key`.
 *
 * These were literals in navConfig (KDS 7, Inventory 6, Wastage 3) and never moved —
 * the sidebar asserted six low-stock items on a site with one. A badge is a claim that
 * something needs attention; a wrong one trains people to ignore all of them.
 *
 * Only manager and owner have badges, and `floor.stats` is `manager+`, so the query is
 * disabled for waiter and kitchen rather than 403-ing on every page load.
 */
export function useNavBadges(role: Role): Record<string, NavBadge> {
  const enabled = role === 'manager' || role === 'owner';

  const { data } = useQuery({
    queryKey: ['floor', 'stats'],
    queryFn: async () => unwrapOk(await apiGet<SrvFloorStats>(METHODS.floorStats)),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    refetchIntervalInBackground: false,
  });

  if (!data) return {};

  // Zero is not rendered — an empty badge is noise, and `count: 0` reads as a bug.
  const badges: Record<string, NavBadge> = {};
  if (data.slaBreaches > 0) badges.kds = { count: data.slaBreaches, tone: 'alert' };
  if (data.lowStock > 0) badges.stock = { count: data.lowStock, tone: 'alert' };
  if (data.pendingWastage > 0) badges.wast = { count: data.pendingWastage, tone: 'amber' };
  return badges;
}

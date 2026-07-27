import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOwnerDashboard } from '@/lib/api/owner';
import { getMenuItems } from '@/lib/api/orders';
import { useSessionStore } from '@/stores/session';
import type { MenuItem } from '@/types/domain';

/**
 * Owner dashboard.
 *
 * `owner.dashboard` returns figures; the screen renders a dashboard. Two joins close
 * the gap with real data rather than invented text: the owner's name from the live
 * session, and each best-selling dish's category from the menu (bestDishes carries
 * only a code).
 */
export function useOwnerDashboard(period: 'day' | 'week' | 'month' = 'day') {
  const qc = useQueryClient();
  const fullName = useSessionStore((s) => s.user?.fullName ?? 'Owner');

  return useQuery({
    queryKey: ['owner', 'dashboard', period],
    queryFn: async () => {
      const items = await qc
        .ensureQueryData<MenuItem[]>({ queryKey: ['menu', 'items'], queryFn: getMenuItems })
        .catch(() => [] as MenuItem[]);

      const categoryByCode = new Map(items.map((i) => [i.id, i.categoryId]));
      return getOwnerDashboard({ ownerName: fullName, categoryByCode }, period);
    },
  });
}

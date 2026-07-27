import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet, unwrapOk } from '@/lib/api/http';
import { METHODS } from '@/lib/api/endpoints';
import { MenuCategorySchema, MenuItemSchema } from '@/types/api';
import { toMenuCategory, toMenuItem } from '@/lib/api/adapters';
import type { MenuCategory, MenuItem } from '@/types/domain';
import type { SrvGuestMenu } from '@/types/server';

/**
 * The QR / kiosk menu.
 *
 * A guest surface must NOT call `menu.items` — that method requires a staff session.
 * `guest.menu` is the unauthenticated equivalent: it resolves the table by slug,
 * filters to `is_guest_orderable` items, drops anything 86'd, and returns categories
 * and items in one payload.
 *
 * `authScope: 'guest'` matters beyond the request itself: without it a 403 here would
 * trip the force-logout path and sign a staff user out of another tab.
 */
export type GuestMenu = {
  branchLabel: string;
  tableNumber: string;
  categories: MenuCategory[];
  items: MenuItem[];
};

export function useGuestMenu(slug: string) {
  return useQuery({
    queryKey: ['guest', 'menu', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<GuestMenu> => {
      const raw = await apiGet<SrvGuestMenu>(METHODS.guestMenu, {
        query: { t: slug },
        authScope: 'guest',
      });
      const menu = unwrapOk(raw);

      return {
        branchLabel: menu.branchLabel ?? 'Naqsha',
        tableNumber: menu.tableNumber,
        categories: z
          .array(MenuCategorySchema)
          .parse(menu.categories.map((c) => toMenuCategory({ ...c, station: null }))),
        items: z.array(MenuItemSchema).parse(menu.items.map(toMenuItem)),
      };
    },
  });
}

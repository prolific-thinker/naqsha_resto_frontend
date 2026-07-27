import type { MenuCategory, MenuItem } from '@/types/domain';
import type { SrvCategory, SrvMenuItem } from '@/types/server';
import { opt, station } from './shared';

/** `menu.categories` / `menu.items` → `MenuCategorySchema` / `MenuItemSchema`. */

export function toMenuCategory(raw: SrvCategory): MenuCategory {
  return {
    id: raw.id,
    name: raw.name,
    count: raw.count,
    // Item Group.restaurant_station is an optional custom field, so a category that
    // has never been assigned one arrives as null. The schema requires a string.
    station: station(raw.station),
  };
}

export function toMenuItem(raw: SrvMenuItem): MenuItem {
  return {
    id: raw.code,
    name: raw.name,
    // Required string in the schema; the server sends null when the Item has no
    // description (menu.py::_plain returns None for empty HTML).
    description: raw.description ?? '',
    price: raw.price,
    station: station(raw.station),
    categoryId: raw.category,
    outOfStock: raw.is86 || undefined,
    outOfStockReason: opt(raw.outOfStockReason),
  };
}

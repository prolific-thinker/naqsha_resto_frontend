import { z } from 'zod';
import type { MenuCategory, MenuItem, Table, TakeawayOrder } from '@/types/domain';
import { MenuCategorySchema, MenuItemSchema, TableSchema } from '@/types/api';
import { apiGet, unwrapOk } from './http';
import { METHODS } from './endpoints';
import { toMenuCategory, toMenuItem, toTableList } from './adapters';
import type { SrvCategory, SrvMenuItem, SrvTable } from '@/types/server';

/**
 * Floor and menu reads.
 *
 * Both the waiter and manager floors request `scope=all`. That is not an oversight:
 * the waiter screen shows the *whole* floor — its legend is Free / Mine / Other
 * waiter, and it counts "mine" client-side from the `mine` display state. `scope=mine`
 * would hide every free table and break the screen. Two functions exist only so the
 * two views get separate query keys.
 */

export async function getWaiterTables(): Promise<Table[]> {
  const raw = await apiGet<SrvTable[]>(METHODS.tables, { query: { scope: 'all' } });
  return z.array(TableSchema).parse(toTableList(unwrapOk(raw)));
}

export async function getManagerTables(): Promise<Table[]> {
  const raw = await apiGet<SrvTable[]>(METHODS.tables, { query: { scope: 'all' } });
  return z.array(TableSchema).parse(toTableList(unwrapOk(raw)));
}

/**
 * Takeaway has no backend read in v1 — takeaway orders are Sales Orders with no
 * `restaurant_table`, and nothing aggregates them yet. Returning empty is honest:
 * the strip renders "0 in progress" rather than mock data a manager might act on.
 */
export function getTakeawayOrders(): Promise<TakeawayOrder[]> {
  return Promise.resolve([]);
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const raw = await apiGet<SrvCategory[]>(METHODS.menuCategories);
  return z.array(MenuCategorySchema).parse(unwrapOk(raw).map(toMenuCategory));
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const raw = await apiGet<SrvMenuItem[]>(METHODS.menuItems);
  return z.array(MenuItemSchema).parse(unwrapOk(raw).map(toMenuItem));
}

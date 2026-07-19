import { z } from 'zod';
import type { MenuCategory, MenuItem, Table, TakeawayOrder } from '@/types/domain';
import { MenuCategorySchema, MenuItemSchema, TableSchema, TakeawayOrderSchema } from '@/types/api';
import { mockGet } from './client';
import { httpGet, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
import { MANAGER_TABLES, TAKEAWAY_ORDERS, WAITER_TABLES } from '@/lib/mocks/tables';
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/mocks/menu';

export function getWaiterTables(): Promise<Table[]> {
  const schema = z.array(TableSchema);
  return USE_MOCKS ? mockGet(schema, WAITER_TABLES) : httpGet(ENDPOINTS.waiterTables(), schema);
}

export function getManagerTables(): Promise<Table[]> {
  const schema = z.array(TableSchema);
  return USE_MOCKS ? mockGet(schema, MANAGER_TABLES) : httpGet(ENDPOINTS.managerTables(), schema);
}

export function getTakeawayOrders(): Promise<TakeawayOrder[]> {
  const schema = z.array(TakeawayOrderSchema);
  return USE_MOCKS ? mockGet(schema, TAKEAWAY_ORDERS) : httpGet(ENDPOINTS.takeaway(), schema);
}

export function getMenuCategories(): Promise<MenuCategory[]> {
  const schema = z.array(MenuCategorySchema);
  return USE_MOCKS ? mockGet(schema, MENU_CATEGORIES) : httpGet(ENDPOINTS.menuCategories(), schema);
}

export function getMenuItems(): Promise<MenuItem[]> {
  const schema = z.array(MenuItemSchema);
  return USE_MOCKS ? mockGet(schema, MENU_ITEMS) : httpGet(ENDPOINTS.menuItems(), schema);
}

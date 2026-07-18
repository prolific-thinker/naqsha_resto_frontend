import { z } from 'zod';
import type { MenuCategory, MenuItem, Table, TakeawayOrder } from '@/types/domain';
import { MenuCategorySchema, MenuItemSchema, TableSchema, TakeawayOrderSchema } from '@/types/api';
import { mockGet } from './client';
import { MANAGER_TABLES, TAKEAWAY_ORDERS, WAITER_TABLES } from '@/lib/mocks/tables';
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/mocks/menu';

export function getWaiterTables(): Promise<Table[]> {
  return mockGet(z.array(TableSchema), WAITER_TABLES);
}

export function getManagerTables(): Promise<Table[]> {
  return mockGet(z.array(TableSchema), MANAGER_TABLES);
}

export function getTakeawayOrders(): Promise<TakeawayOrder[]> {
  return mockGet(z.array(TakeawayOrderSchema), TAKEAWAY_ORDERS);
}

export function getMenuCategories(): Promise<MenuCategory[]> {
  return mockGet(z.array(MenuCategorySchema), MENU_CATEGORIES);
}

export function getMenuItems(): Promise<MenuItem[]> {
  return mockGet(z.array(MenuItemSchema), MENU_ITEMS);
}

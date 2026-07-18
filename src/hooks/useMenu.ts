import { useQuery } from '@tanstack/react-query';
import { getMenuCategories, getMenuItems } from '@/lib/api/orders';

export function useMenuCategories() {
  return useQuery({ queryKey: ['menu', 'categories'], queryFn: getMenuCategories });
}

export function useMenuItems() {
  return useQuery({ queryKey: ['menu', 'items'], queryFn: getMenuItems });
}

import { useQuery } from '@tanstack/react-query';
import { getManagerTables, getTakeawayOrders, getWaiterTables } from '@/lib/api/orders';

export function useWaiterTables() {
  return useQuery({ queryKey: ['tables', 'waiter'], queryFn: getWaiterTables });
}

export function useManagerTables() {
  return useQuery({ queryKey: ['tables', 'manager'], queryFn: getManagerTables });
}

export function useTakeawayOrders() {
  return useQuery({ queryKey: ['takeaway'], queryFn: getTakeawayOrders });
}

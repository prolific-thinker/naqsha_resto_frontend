import { useQuery } from '@tanstack/react-query';
import { getOwnerDashboard } from '@/lib/api/owner';

export function useOwnerDashboard() {
  return useQuery({ queryKey: ['owner', 'dashboard'], queryFn: getOwnerDashboard });
}

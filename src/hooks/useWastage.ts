import { useQuery } from '@tanstack/react-query';
import { getApprovalCounts, getPendingApprovals, getWeekSummary } from '@/lib/api/wastage';

export function usePendingApprovals() {
  return useQuery({ queryKey: ['wastage', 'pending'], queryFn: getPendingApprovals });
}

export function useApprovalCounts() {
  return useQuery({ queryKey: ['wastage', 'counts'], queryFn: getApprovalCounts });
}

export function useWeekSummary() {
  return useQuery({ queryKey: ['wastage', 'week'], queryFn: getWeekSummary });
}

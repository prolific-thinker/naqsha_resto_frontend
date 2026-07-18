import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAggregateRows } from '@/lib/api/kitchen';
import { subscribe } from '@/lib/realtime/socket';

/** Manager KDS aggregate (M-02) with realtime refresh on KOT ticks. */
export function useAggregate() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['aggregate'], queryFn: getAggregateRows });

  useEffect(() => {
    const unsubscribe = subscribe('kds:*', () => {
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
    });
    return unsubscribe;
  }, [qc]);

  return query;
}

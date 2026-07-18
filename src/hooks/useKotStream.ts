import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Station } from '@/types/domain';
import { getKdsBoard } from '@/lib/api/kitchen';
import { subscribe } from '@/lib/realtime/socket';

/**
 * KDS station board + realtime. Subscribes to the station channel; each fake
 * push refetches the board so the wall display feels live (handover §7).
 */
export function useKotStream(station: Station) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['kds', station], queryFn: () => getKdsBoard(station) });

  useEffect(() => {
    const unsubscribe = subscribe(`kds:${station}`, () => {
      void qc.invalidateQueries({ queryKey: ['kds', station] });
    });
    return unsubscribe;
  }, [station, qc]);

  return query;
}

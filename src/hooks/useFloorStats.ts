import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, unwrapOk } from '@/lib/api/http';
import { METHODS } from '@/lib/api/endpoints';
import { subscribe } from '@/lib/realtime/socket';
import type { SrvFloorStats } from '@/types/server';

/**
 * The floor header and its five stat tiles.
 *
 * Every number here used to be a literal in `floor.tsx` — "14 active orders", "7 / 10
 * open", "SLA breaches · T-03 (BBQ)" on a floor where T-03 was free. Derived server-side
 * from the same rows the cards read, so the tiles and the grid cannot disagree.
 */
export function useFloorStats() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['floor', 'stats'],
    queryFn: async () => unwrapOk(await apiGet<SrvFloorStats>(METHODS.floorStats)),
    // A wall-mounted floor board should not go stale if the socket drops.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const off = [
      subscribe('tables', () => void qc.invalidateQueries({ queryKey: ['floor', 'stats'] })),
      subscribe('aggregate', () => void qc.invalidateQueries({ queryKey: ['floor', 'stats'] })),
    ];
    return () => off.forEach((fn) => fn());
  }, [qc]);

  return query;
}

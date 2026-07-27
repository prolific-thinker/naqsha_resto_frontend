import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAggregateRows, getKdsBoard } from '@/lib/api/kitchen';
import { subscribe } from '@/lib/realtime/socket';
import { KNOWN_STATIONS, type KdsBoard, type Kot } from '@/types/domain';

/**
 * Manager KDS aggregate, with realtime refresh on KOT ticks.
 *
 * `kds.aggregate` sends only `{station, state}` per KOT — no item names, no
 * per-station timings — but the row renders "2× cappuccino · 1× karak chai" and a
 * per-station clock. Those come from the three station boards, which `ensureQueryData`
 * shares with the KDS screens rather than refetching: same query keys, same staleTime,
 * invalidated by the same event.
 */
export function useAggregate() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['aggregate'],
    queryFn: async () => {
      const boards = await Promise.all(
        KNOWN_STATIONS.map(async (station) => {
          try {
            const board = await qc.ensureQueryData<KdsBoard>({
              queryKey: ['kds', station],
              queryFn: () => getKdsBoard(station),
            });
            return [station, board] as const;
          } catch {
            // One station board failing must not take the whole aggregate down;
            // that row's line degrades to a ticket count.
            return [station, null] as const;
          }
        }),
      );

      // tableRef -> station -> its KOTs
      const byTable = new Map<string, Map<string, Kot[]>>();
      for (const [station, board] of boards) {
        if (!board) continue;
        for (const kot of [...board.queue, ...board.active, ...board.prepared]) {
          const table = byTable.get(kot.tableRef) ?? new Map<string, Kot[]>();
          table.set(station, [...(table.get(station) ?? []), kot]);
          byTable.set(kot.tableRef, table);
        }
      }

      return getAggregateRows(byTable);
    },
    // Backstop: if the socket drops, the wall display degrades to polling rather
    // than freezing. Paused while the tab is hidden.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const unsubscribe = subscribe('aggregate', () => {
      void qc.invalidateQueries({ queryKey: ['aggregate'] });
    });
    return unsubscribe;
  }, [qc]);

  return query;
}

import { useMemo } from 'react';
import { useManagerTables } from './useOpenTables';

/** Derived SLA-breach list for the manager floor stat tile. */
export function useSlaBreaches() {
  const { data: tables } = useManagerTables();
  return useMemo(() => (tables ?? []).filter((t) => t.state === 'breach'), [tables]);
}

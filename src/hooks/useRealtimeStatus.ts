import { useEffect, useState } from 'react';
import { getRealtimeStatus, watchRealtimeStatus, type RealtimeStatus } from '@/lib/realtime/socket';

/**
 * Live socket state, for the KDS footer and the offline indicator.
 *
 * Worth surfacing rather than assuming: a wall display whose socket has dropped looks
 * identical to one where the kitchen is simply quiet, and the difference matters.
 */
export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(getRealtimeStatus);
  useEffect(() => watchRealtimeStatus(setStatus), []);
  return status;
}

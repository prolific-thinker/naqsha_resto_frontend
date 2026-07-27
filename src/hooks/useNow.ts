import { useEffect, useState } from 'react';

/**
 * Ticking clock. Returns the current epoch (ms) and re-renders every
 * `intervalMs`, so live timers (KDS SLA counters, camera clocks) count in real
 * time from a real timestamp instead of a frozen value. One interval per mounted
 * consumer; cheap enough for the handful of screens that need it.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Whole seconds elapsed between an ISO timestamp and `now` (never negative). */
export function elapsedSecondsSince(isoTimestamp: string | undefined, now: number): number {
  if (!isoTimestamp) return 0;
  const started = Date.parse(isoTimestamp);
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}

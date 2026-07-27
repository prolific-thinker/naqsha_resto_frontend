import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * B-5 · Offline mode surface. Reflects real connectivity (navigator.onLine +
 * online/offline events). When offline, orders/payments queue in an outbox and
 * replay on reconnect — here we show the queued count. The queue itself is a
 * frontend concern (IndexedDB) that posts POS Invoices with an idempotency key
 * when the connection returns (see docs/BACKEND_WORKFLOWS.md §5).
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  // Demo outbox: how many writes are buffered while offline.
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setQueued(0); // outbox drains on reconnect
    };
    const goOffline = () => {
      setOnline(false);
      setQueued((q) => q + 1);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-ref text-success', className)}>
        <Wifi size={13} /> online
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-[#E9C79B] bg-amber-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-ref text-amber',
        className,
      )}
      title="Working offline — orders and payments will sync when the connection returns"
    >
      <WifiOff size={13} /> offline{queued > 0 && ` · ${queued} queued`}
    </span>
  );
}

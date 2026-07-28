import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useToastStore, type Toast, type ToastKind } from '@/stores/toasts';

/**
 * Renders the toast stack. Mounted once, inside the auth boundary.
 *
 * Positioned bottom-right and sized for a **tablet held in a hand**, which is the device
 * that actually receives these. The dismiss target is the whole card rather than a small
 * ✕, because the recipient is frequently holding plates.
 */

const KIND_STYLE: Record<ToastKind, { card: string; rail: string; label: string }> = {
  // Green: something good is waiting for you.
  collect: {
    card: 'border-success/50 bg-success-2',
    rail: 'bg-success',
    label: 'Ready',
  },
  // Red: a human is asking you to move. Deliberately the loudest of the three.
  escalate: {
    card: 'border-alert/60 bg-alert-2',
    rail: 'bg-alert',
    label: 'Escalated',
  },
  info: {
    card: 'border-line-2 bg-paper-2',
    rail: 'bg-muted',
    label: '',
  },
};

/** Auto-dismiss window for non-sticky toasts. */
const LINGER_MS = 6000;

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = KIND_STYLE[toast.kind];
  const [age, setAge] = useState(0);

  useEffect(() => {
    if (!toast.sticky) {
      const t = setTimeout(() => dismiss(toast.id), LINGER_MS);
      return () => clearTimeout(t);
    }
    // A sticky toast shows how long it has been waiting. A collect notification that has
    // sat for four minutes is a different message from one that just arrived, and the
    // waiter cannot tell those apart from the text alone.
    const i = setInterval(() => setAge(Math.floor((Date.now() - toast.at) / 1000)), 1000);
    return () => clearInterval(i);
  }, [toast.id, toast.sticky, toast.at, dismiss]);

  const waited = age >= 60 ? `${Math.floor(age / 60)}m ago` : age >= 5 ? `${age}s ago` : null;

  return (
    <button
      type="button"
      onClick={() => dismiss(toast.id)}
      className={cn(
        'pointer-events-auto flex w-[340px] max-w-[calc(100vw-2rem)] items-stretch gap-0',
        'overflow-hidden rounded-lg border text-left shadow-lg',
        'animate-toast-in',
        style.card,
      )}
    >
      <span className={cn('w-1.5 shrink-0', style.rail)} aria-hidden />
      <span className="flex-1 px-4 py-3">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[15px] font-bold leading-tight text-ink">
            {toast.title}
          </span>
          {waited && (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-ref text-muted">
              {waited}
            </span>
          )}
        </span>
        {toast.body && <span className="mt-1 block text-[12.5px] text-ink">{toast.body}</span>}
        <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-ref text-muted">
          {toast.sticky ? 'Tap to acknowledge' : 'Tap to dismiss'}
        </span>
      </span>
    </button>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div
      // aria-live so a screen reader announces an arrival; pointer-events-none on the
      // container so the stack never blocks the screen underneath between toasts.
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

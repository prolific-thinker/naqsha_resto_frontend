import { cn } from '@/lib/utils';

type Props = {
  /** Station header row (name + code + capacity + clock). */
  head: React.ReactNode;
  /** Bottom metrics strip. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Kitchen display shell (mockup K-01) — dark, full-bleed, station header on
 * top, 3-column body, metrics footer. Sized for a wall display.
 */
export function KdsShell({ head, footer, children, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-screen flex-col overflow-hidden bg-ink px-6 py-5 text-paper',
        className,
      )}
    >
      <div className="mb-5 flex flex-shrink-0 items-baseline justify-between">{head}</div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && (
        <div className="mt-4 flex flex-shrink-0 justify-between rounded bg-white/[0.03] px-4 py-3 font-mono text-[11px] text-line-2">
          {footer}
        </div>
      )}
    </div>
  );
}

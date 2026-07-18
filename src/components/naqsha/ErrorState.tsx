import { cn } from '@/lib/utils';

type Props = {
  /** Short label for what failed to load, e.g. "floor". */
  label?: string;
  onRetry?: () => void;
  tone?: 'paper' | 'dark';
  className?: string;
};

/** Query-error placeholder with an optional retry. */
export function ErrorState({ label = 'data', onRetry, tone = 'paper', className }: Props) {
  return (
    <div
      className={cn(
        'grid place-items-center gap-3 rounded-md border border-dashed p-8 text-center',
        tone === 'dark' ? 'border-alert/50 text-line-2' : 'border-alert/50 text-muted',
        className,
      )}
    >
      <div className="text-[13px]">Couldn&apos;t load {label}.</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-line-strong px-3 py-1.5 font-body text-xs font-semibold text-ink hover:bg-paper-3"
        >
          Retry
        </button>
      )}
    </div>
  );
}

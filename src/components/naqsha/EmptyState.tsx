import { cn } from '@/lib/utils';

type Props = {
  message: string;
  /** 'paper' for light surfaces, 'dark' for KDS/camera surfaces. */
  tone?: 'paper' | 'dark';
  className?: string;
};

/** Neutral empty-state placeholder for list views. */
export function EmptyState({ message, tone = 'paper', className }: Props) {
  return (
    <div
      className={cn(
        'grid place-items-center rounded-md border border-dashed p-8 text-center text-[13px]',
        tone === 'dark' ? 'border-ink-3 text-muted-2' : 'border-line-strong text-muted',
        className,
      )}
    >
      {message}
    </div>
  );
}

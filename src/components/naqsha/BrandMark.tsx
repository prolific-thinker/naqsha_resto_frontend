import { cn } from '@/lib/utils';

type Props = {
  /** Text color; defaults to ink for paper surfaces. */
  className?: string;
  /** Smaller variant used on the customer phone header. */
  size?: 'md' | 'sm';
};

/** Naqsha wordmark — saffron square dot + display type (mockup `.brand`). */
export function BrandMark({ className, size = 'md' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-display font-bold tracking-[-0.02em] text-ink',
        size === 'md' ? 'text-xl' : 'text-sm',
        className,
      )}
    >
      <span className="mr-2 inline-block h-2 w-2 rounded-[1px] bg-saffron align-middle" />
      Naqsha
    </span>
  );
}

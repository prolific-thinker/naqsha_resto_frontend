import { cn } from '@/lib/utils';

type Props = {
  /** Tick color. Defaults to teal (the mockup signature). */
  className?: string;
};

/**
 * Registration ticks — 10×10px L-shapes at each corner of a card, 1.5px teal.
 * The identity signal from the mockups (`.ticks`). Render as the first child of
 * a `relative` container; ticks sit just outside the border, non-interactive.
 */
export function CornerTicks({ className }: Props) {
  const base = 'pointer-events-none absolute h-2.5 w-2.5 border-teal';
  return (
    <>
      <span className={cn(base, '-left-px -top-px border-l-[1.5px] border-t-[1.5px]', className)} />
      <span className={cn(base, '-right-px -top-px border-r-[1.5px] border-t-[1.5px]', className)} />
      <span className={cn(base, '-bottom-px -left-px border-b-[1.5px] border-l-[1.5px]', className)} />
      <span className={cn(base, '-bottom-px -right-px border-b-[1.5px] border-r-[1.5px]', className)} />
    </>
  );
}

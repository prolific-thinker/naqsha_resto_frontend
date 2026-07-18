import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  /** Wider tracking for standalone codes; default is the mockup 0.1em. */
  tracking?: 'ref' | 'code';
  className?: string;
};

/**
 * Sheet reference code — mono, uppercase, letter-spaced, muted. The identity
 * signal: A-01, KOT-D-1042, INV-C-2026-0234, WST-C-2026-0018 (handover §5).
 */
export function SheetRef({ children, tracking = 'code', className }: Props) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] uppercase text-muted',
        tracking === 'code' ? 'tracking-code' : 'tracking-ref',
        className,
      )}
    >
      {children}
    </span>
  );
}

import { cn } from '@/lib/utils';

export type ChipVariant = 'teal' | 'amber' | 'success' | 'alert' | 'muted' | 'ink';

type Props = {
  variant: ChipVariant;
  children: React.ReactNode;
  className?: string;
};

// Border colors are chip-specific tints from the mockup (.chip-*), not part of
// the core token set — kept as arbitrary values so chips read exactly as designed.
const VARIANTS: Record<ChipVariant, string> = {
  teal: 'bg-teal-3 text-teal border-[#B8D4D8]',
  amber: 'bg-amber-2 text-amber border-[#E9C79B]',
  success: 'bg-success-2 text-success border-[#B0D4C0]',
  alert: 'bg-alert-2 text-alert border-[#E5B4AE]',
  muted: 'bg-paper-3 text-muted border-line',
  ink: 'bg-ink text-paper border-ink',
};

/**
 * Status pill — mono, uppercase, 10px. Never use full-color solid buttons for
 * status; use these chips (handover §5).
 */
export function Chip({ variant, children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-[9px] py-[3px]',
        'font-mono text-[10px] font-medium uppercase tracking-[0.05em]',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

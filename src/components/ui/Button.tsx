import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'ghost' | 'saffron' | 'alert';
export type ButtonSize = 'md' | 'lg' | 'sm';

type Props = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
  className?: string;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-paper hover:bg-teal-2',
  ghost: 'bg-transparent text-ink border border-line-strong hover:bg-paper-3',
  saffron: 'bg-saffron text-ink hover:brightness-105',
  alert: 'bg-alert text-paper hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-[13px]',
  lg: 'px-[22px] py-[14px] text-sm',
};

/** Naqsha button (mockup `.btn`). Explicit props, no `...rest` spread. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled,
  title,
  'aria-label': ariaLabel,
  className,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-body font-semibold tracking-[0.01em]',
        'cursor-pointer transition-[background,filter] disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

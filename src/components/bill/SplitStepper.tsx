import { cn } from '@/lib/utils';

type Props = {
  value: number;
  min?: number;
  onChange: (next: number) => void;
  className?: string;
};

/** −/count/+ stepper for splitting a bill (mockup `.split-input .stepper`). */
export function SplitStepper({ value, min = 1, onChange, className }: Props) {
  const btn =
    'grid h-7 w-7 place-items-center rounded-sm border border-line-strong bg-paper font-display text-base font-bold text-ink disabled:opacity-40';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label="Fewer people"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btn}
      >
        −
      </button>
      <input
        value={value}
        readOnly
        aria-label="People sharing"
        className="w-10 rounded-sm border border-line-strong py-1 text-center font-mono text-[13px]"
      />
      <button type="button" aria-label="More people" onClick={() => onChange(value + 1)} className={btn}>
        +
      </button>
    </div>
  );
}

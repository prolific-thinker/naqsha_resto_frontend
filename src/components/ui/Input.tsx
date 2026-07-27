import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?:
    | 'text'
    | 'search'
    | 'tel'
    | 'number'
    | 'email'
    | 'password'
    | 'date'
    // A reservation and a campaign send are both a date AND a time; a bare `date`
    // loses the half that decides which sitting the booking is for.
    | 'datetime-local';
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  /** number inputs only — the browser enforces these before submit. */
  min?: string;
  max?: string;
  step?: string;
  required?: boolean;
  'aria-label'?: string;
  className?: string;
};

/** Token-styled text input (mockup `.form-field input`). */
export function Input({
  value,
  defaultValue,
  placeholder,
  type = 'text',
  onChange,
  disabled,
  name,
  id,
  autoComplete,
  inputMode,
  min,
  max,
  step,
  required,
  'aria-label': ariaLabel,
  className,
}: Props) {
  return (
    <input
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      type={type}
      onChange={onChange}
      disabled={disabled}
      name={name}
      id={id}
      autoComplete={autoComplete}
      inputMode={inputMode}
      min={min}
      max={max}
      step={step}
      required={required}
      aria-label={ariaLabel}
      className={cn(
        'w-full rounded border border-line-strong bg-paper px-3 py-2.5 font-body text-[13px] text-ink',
        'outline-none placeholder:text-muted-2 focus-visible:border-teal',
        className,
      )}
    />
  );
}

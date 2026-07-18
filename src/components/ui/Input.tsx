import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: 'text' | 'search' | 'tel' | 'number' | 'email';
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  name?: string;
  id?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
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
  inputMode,
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
      inputMode={inputMode}
      aria-label={ariaLabel}
      className={cn(
        'w-full rounded border border-line-strong bg-paper px-3 py-2.5 font-body text-[13px] text-ink',
        'outline-none placeholder:text-muted-2 focus-visible:border-teal',
        className,
      )}
    />
  );
}

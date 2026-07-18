import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

type Props = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
};

/** Token-styled native select (mockup `.form-field select`). */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  id,
  placeholder,
  'aria-label': ariaLabel,
  className,
}: Props) {
  return (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      name={name}
      id={id}
      aria-label={ariaLabel}
      className={cn(
        'w-full rounded border border-line-strong bg-paper px-3 py-2.5 font-body text-[13px] text-ink',
        'outline-none focus-visible:border-teal',
        className,
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

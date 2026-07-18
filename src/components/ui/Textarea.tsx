import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  name?: string;
  id?: string;
  rows?: number;
  'aria-label'?: string;
  className?: string;
};

/** Token-styled textarea (mockup `.form-field textarea`). */
export function Textarea({
  value,
  defaultValue,
  placeholder,
  onChange,
  disabled,
  name,
  id,
  rows = 3,
  'aria-label': ariaLabel,
  className,
}: Props) {
  return (
    <textarea
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      name={name}
      id={id}
      rows={rows}
      aria-label={ariaLabel}
      className={cn(
        'w-full resize-none rounded border border-line-strong bg-paper px-3 py-2.5 font-body text-[13px] text-ink',
        'outline-none placeholder:text-muted-2 focus-visible:border-teal',
        className,
      )}
    />
  );
}

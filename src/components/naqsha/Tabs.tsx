import { cn } from '@/lib/utils';

export type TabDef = { key: string; code?: string; label: string };

type Props = {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

/**
 * Underlined tab strip matching the owner/manager treatment (mockup tab rows).
 * Controlled — parent owns the active key.
 */
export function Tabs({ tabs, active, onChange, className }: Props) {
  return (
    <div className={cn('flex gap-6 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 py-2.5 font-display text-[13px] font-medium',
              on ? 'border-saffron font-semibold text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.code && (
              <span className={cn('mr-1.5 font-mono text-[10px]', on ? 'text-saffron' : 'text-muted')}>
                {t.code}
              </span>
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

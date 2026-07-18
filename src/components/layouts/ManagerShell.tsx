import { cn } from '@/lib/utils';
import { NavRail } from './NavRail';

type Props = {
  title: string;
  /** Sheet ref / session code shown next to the title. */
  refCode?: string;
  /** Top-bar right slot — stats and actions. */
  right?: React.ReactNode;
  children: React.ReactNode;
  /** M-05 cameras uses a dark main surface. */
  theme?: 'paper' | 'dark';
  className?: string;
};

/**
 * Manager console shell (mockup `.mgr-shell`) — icon rail + 60px top bar + main
 * body. Fills a desktop viewport.
 */
export function ManagerShell({ title, refCode, right, children, theme = 'paper', className }: Props) {
  const dark = theme === 'dark';
  return (
    <div className={cn('grid h-screen grid-cols-[60px_1fr] overflow-hidden', className)}>
      <NavRail className={dark ? 'bg-ink-2' : undefined} />
      <div className={cn('flex flex-col overflow-hidden', dark ? 'bg-ink text-paper' : 'bg-paper text-ink')}>
        <div
          className={cn(
            'flex h-[60px] flex-shrink-0 items-center justify-between border-b px-6',
            dark ? 'border-ink-3 bg-ink-2' : 'border-line bg-paper-2',
          )}
        >
          <div className="flex items-baseline gap-3">
            <h2
              className={cn(
                'font-display text-lg font-semibold tracking-[-0.01em]',
                dark ? 'text-paper' : 'text-ink',
              )}
            >
              {title}
            </h2>
            {refCode && (
              <span
                className={cn(
                  'font-mono text-[11px] tracking-ref',
                  dark ? 'text-line-2' : 'text-muted',
                )}
              >
                {refCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">{right}</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

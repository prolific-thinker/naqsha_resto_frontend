import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { OfflineIndicator } from '@/components/naqsha/OfflineIndicator';

type Props = {
  title: string;
  /** Deprecated — no longer rendered (kept so call sites still typecheck). */
  refCode?: string;
  /** Top-bar right slot — stats and actions. */
  right?: React.ReactNode;
  children: React.ReactNode;
  /** Cameras use a dark main surface. */
  theme?: 'paper' | 'dark';
  className?: string;
};

/**
 * Manager console shell — shared responsive sidebar + 60px top bar + main body.
 * Fills a desktop viewport; collapses the sidebar to an icon rail on tablet and a
 * hamburger drawer on phone (see AppSidebar).
 */
export function ManagerShell({ title, right, children, theme = 'paper', className }: Props) {
  const dark = theme === 'dark';
  return (
    <div className={cn('flex h-screen overflow-hidden', className)}>
      <AppSidebar role="manager" />
      <div className={cn('flex min-w-0 flex-1 flex-col overflow-hidden', dark ? 'bg-ink text-paper' : 'bg-paper text-ink')}>
        <div
          className={cn(
            'flex h-[60px] flex-shrink-0 items-center justify-between border-b pl-16 pr-6 md:px-6',
            dark ? 'border-ink-3 bg-ink-2' : 'border-line bg-paper-2',
          )}
        >
          <div className="flex min-w-0 items-baseline gap-3">
            <h2
              className={cn(
                'truncate font-display text-lg font-semibold',
                dark ? 'text-paper' : 'text-ink',
              )}
            >
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {!dark && <OfflineIndicator />}
            {right}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

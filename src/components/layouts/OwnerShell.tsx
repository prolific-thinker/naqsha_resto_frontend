import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';

type Props = {
  /** Small uppercase mono eyebrow above the title. */
  greet: string;
  title: string;
  lead?: string;
  /** Top-right action buttons. */
  actions?: React.ReactNode;
  /** Period / status tab strip. */
  tabs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Owner portal shell — shared responsive sidebar + a top block (greeting, title,
 * lead, actions, tab strip) then a scrollable paper body. Responsive to phone.
 */
export function OwnerShell({ greet, title, lead, actions, tabs, children, className }: Props) {
  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <AppSidebar role="owner" />
      <div className={cn('flex min-w-0 flex-1 flex-col', className)}>
        <div className="border-b border-line bg-paper pb-6 pl-16 pr-6 pt-8 md:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-muted">{greet}</div>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
                {title}
              </h2>
              {lead && <div className="mt-1 text-[13px] text-muted">{lead}</div>}
            </div>
            {actions && <div className="flex flex-shrink-0 gap-2">{actions}</div>}
          </div>
          {tabs}
        </div>
        <div className="flex-1 overflow-x-auto px-6 py-6 md:px-10">{children}</div>
      </div>
    </div>
  );
}

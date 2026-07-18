import { cn } from '@/lib/utils';

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
 * Owner portal shell (mockup O-01/O-02) — top block with greeting, title, lead,
 * actions and a tab strip, then a scrollable paper body. Responsive to 375px.
 */
export function OwnerShell({ greet, title, lead, actions, tabs, children, className }: Props) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-paper', className)}>
      <div className="border-b border-line bg-paper px-6 pt-8 pb-6 sm:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-ref text-muted">{greet}</div>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-[-0.02em] text-ink">
              {title}
            </h2>
            {lead && <div className="mt-1 text-[13px] text-muted">{lead}</div>}
          </div>
          {actions && <div className="flex flex-shrink-0 gap-2">{actions}</div>}
        </div>
        {tabs}
      </div>
      <div className="flex-1 px-6 py-6 sm:px-10">{children}</div>
    </div>
  );
}

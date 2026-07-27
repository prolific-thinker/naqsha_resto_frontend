import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/naqsha/BrandMark';
import { AppSidebar } from './AppSidebar';

type Props = {
  /** Left slot in the top bar (brand is rendered before it). */
  left?: React.ReactNode;
  /** Right slot in the top bar (waiter identity, refs, avatar). */
  right?: React.ReactNode;
  /** Optional tab strip below the top bar (A-01 floor view). */
  tabs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Waiter tablet shell — shared responsive sidebar + 56px top bar + optional tab
 * strip. Sidebar is an icon rail on tablet and a hamburger drawer on phone.
 */
export function WaiterShell({ left, right, tabs, children, className }: Props) {
  return (
    <div className={cn('flex h-screen overflow-hidden bg-paper text-ink', className)}>
      <AppSidebar role="waiter" />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line bg-paper-2 pl-16 pr-6 md:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <BrandMark className="md:hidden" />
            {left}
          </div>
          <div className="flex items-center gap-4">{right}</div>
        </div>
        {tabs}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

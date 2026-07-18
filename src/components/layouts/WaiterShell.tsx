import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/naqsha/BrandMark';

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
 * Waiter tablet shell (mockup A-01/A-02) — 56px top bar + optional tab strip,
 * paper background. Fills the tablet viewport.
 */
export function WaiterShell({ left, right, tabs, children, className }: Props) {
  return (
    <div className={cn('flex h-screen flex-col overflow-hidden bg-paper', className)}>
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line bg-paper-2 px-6">
        <div className="flex items-center gap-5">
          <BrandMark />
          {left}
        </div>
        <div className="flex items-center gap-4">{right}</div>
      </div>
      {tabs}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

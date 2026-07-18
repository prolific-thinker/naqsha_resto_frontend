import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  /** grid-template-columns value; genuinely per-table so passed as inline style. */
  cols?: string;
  /** Renders the muted mono uppercase header treatment. */
  header?: boolean;
  className?: string;
};

/**
 * Grid table row shared across screens (mockup `.data-row`). Column layout
 * varies per table, so `cols` is applied as an inline grid-template.
 */
export function DataRow({ children, cols, header = false, className }: Props) {
  return (
    <div
      style={cols ? { gridTemplateColumns: cols } : undefined}
      className={cn(
        'grid items-center border-b border-line py-3 text-[13px]',
        header &&
          'border-b-line-strong pb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}

import { cn } from '@/lib/utils';

type Props = {
  width: number;
  height: number;
  /** Caption shown under the frame. */
  label?: string;
  rounded?: 'md' | 'phone';
  children: React.ReactNode;
  className?: string;
};

/**
 * Dev-only wrapper that constrains a screen to its target device size on a dark
 * backdrop, mirroring the mockup presentation. Not used in production routes.
 */
export function DeviceFrame({ width, height, label, rounded = 'md', children, className }: Props) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-2 p-10">
      <div className="flex flex-col items-center gap-2">
        <div
          style={{ width, height }}
          className={cn(
            'relative overflow-hidden bg-paper shadow-2xl',
            rounded === 'phone' ? 'rounded-[32px] p-2' : 'rounded-lg',
            className,
          )}
        >
          {children}
        </div>
        {label && (
          <div className="font-mono text-[11px] tracking-ref text-muted-2">{label}</div>
        )}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Customer feedback phone shell (mockup C-01) — 375px-max column with the paper
 * gradient wall, centered on larger screens for review. Public, no chrome.
 */
export function PhoneShell({ children, className }: Props) {
  return (
    <div className="min-h-screen bg-ink-2">
      <div
        className={cn(
          'mx-auto flex min-h-screen w-full max-w-[420px] flex-col',
          'bg-gradient-to-b from-paper-2 to-paper px-5 py-6 text-ink',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

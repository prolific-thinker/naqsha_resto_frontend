import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  MonitorPlay,
  ReceiptText,
  Trash2,
  Video,
  MessageSquare,
  Package,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BadgeTone = 'alert' | 'amber';

type RailItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  badge?: { count: number; tone: BadgeTone };
};

const BADGE_TONE: Record<BadgeTone, string> = {
  alert: 'bg-alert',
  amber: 'bg-amber',
};

// POS is per-table; the rail links to a representative open table (real app
// would route through a picker). Fdbk/Stock/Settings are future surfaces with
// no screen in scope (handover §11) — rendered inert.
const ITEMS: RailItem[] = [
  { key: 'floor', label: 'Floor', icon: LayoutGrid, to: '/manager/floor' },
  { key: 'kds', label: 'KDS', icon: MonitorPlay, to: '/manager/kds', badge: { count: 7, tone: 'alert' } },
  { key: 'pos', label: 'POS', icon: ReceiptText, to: '/manager/pos/T-07' },
  { key: 'wast', label: 'Wast', icon: Trash2, to: '/manager/wastage', badge: { count: 3, tone: 'amber' } },
  { key: 'cam', label: 'Cam', icon: Video, to: '/manager/cameras' },
  { key: 'fdbk', label: 'Fdbk', icon: MessageSquare },
  { key: 'stock', label: 'Stock', icon: Package, badge: { count: 6, tone: 'alert' } },
];

function Badge({ count, tone }: { count: number; tone: BadgeTone }) {
  return (
    <span
      className={cn(
        'absolute right-0.5 top-0.5 rounded-lg px-1 py-px font-mono text-[9px] font-semibold text-paper',
        BADGE_TONE[tone],
      )}
    >
      {count}
    </span>
  );
}

function RailButton({ item }: { item: RailItem }) {
  const Icon = item.icon;
  const inner = (active: boolean) => (
    <>
      {item.badge && <Badge count={item.badge.count} tone={item.badge.tone} />}
      <Icon size={17} strokeWidth={active ? 2.25 : 2} />
      <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.04em]">{item.label}</span>
    </>
  );

  const base =
    'relative flex h-11 w-11 flex-col items-center justify-center rounded font-display text-[#B4AB9A]';

  if (!item.to) {
    return (
      <div className={cn(base, 'cursor-default opacity-70')} aria-disabled="true">
        {inner(false)}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(base, 'hover:bg-ink-2 hover:text-paper', isActive && 'bg-ink-2 text-saffron')
      }
    >
      {({ isActive }) => inner(isActive)}
    </NavLink>
  );
}

/** Manager icon rail (mockup `.mgr-rail`). Fixed 60px column, dark. */
export function NavRail({ className }: { className?: string }) {
  return (
    <nav
      className={cn('flex w-[60px] flex-col items-center gap-1 bg-ink py-5', className)}
      aria-label="Manager sections"
    >
      <div className="mb-4 grid h-[34px] w-[34px] place-items-center rounded bg-saffron font-display text-lg font-bold text-ink">
        N
      </div>
      {ITEMS.map((item) => (
        <RailButton key={item.key} item={item} />
      ))}
      <div className="flex-1" />
      <div
        className="grid h-11 w-11 cursor-default place-items-center rounded text-[#B4AB9A] opacity-70"
        aria-disabled="true"
      >
        <Settings size={17} />
      </div>
    </nav>
  );
}

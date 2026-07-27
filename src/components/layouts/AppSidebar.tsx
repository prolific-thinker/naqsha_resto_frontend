import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/domain';
import { useSessionStore } from '@/stores/session';
import { NAV_ITEMS, type NavBadge, type NavItem } from './navConfig';
import { useNavBadges } from '@/hooks/useNavBadges';

const ROLE_LABEL: Record<Role, string> = {
  waiter: 'Waiter',
  manager: 'Manager',
  owner: 'Owner',
  kitchen: 'Kitchen',
};

const BADGE_TONE = { alert: 'bg-alert', amber: 'bg-amber' } as const;

/**
 * Shared role navigation. Responsive:
 *  - ≥ lg  : persistent labeled sidebar (w-56)
 *  - md    : icon-only rail (w-16), labels hidden — good for tablets
 *  - < md  : hidden; a hamburger opens a slide-in drawer with full labels
 *
 * Every role (waiter, manager, owner, kitchen) uses this, driven by NAV_ITEMS.
 */
export function AppSidebar({ role: shellRole }: { role: Role }) {
  const [open, setOpen] = useState(false);
  // The nav belongs to the USER, not to the layout.
  //
  // Each shell passes its own role literal, which is right for the layout and wrong for
  // the sidebar: `/manager/kds` is routed to kitchen as well as manager but renders in
  // ManagerShell, so a kitchen user was shown the entire manager nav — POS, Inventory,
  // Purchasing, Customers — every item of which bounces them straight back out through
  // RequireAuth. The shell's role remains the fallback for the first paint, before the
  // session has resolved.
  const sessionRole = useSessionStore((s) => s.user?.role);
  const role = sessionRole ?? shellRole;

  const items = NAV_ITEMS[role] ?? [];
  const badges = useNavBadges(role);

  return (
    <>
      {/* Desktop / tablet rail */}
      <aside className="hidden shrink-0 flex-col bg-ink md:flex md:w-16 lg:w-56">
        <SidebarBody role={role} items={items} badges={badges} labels="responsive" />
      </aside>

      {/* Phone: floating hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-md bg-ink text-paper shadow-md md:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Phone: drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-ink">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 text-line-2 hover:text-paper"
            >
              <X size={18} />
            </button>
            <SidebarBody role={role} items={items} badges={badges} labels="always" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function SidebarBody({
  role,
  items,
  badges,
  labels,
  onNavigate,
}: {
  role: Role;
  items: NavItem[];
  badges: Record<string, NavBadge>;
  labels: 'responsive' | 'always';
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  // Label visibility: always shown in the drawer; only at ≥lg on the rail.
  const labelCls = labels === 'always' ? 'inline' : 'hidden lg:inline';

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded bg-saffron font-display text-lg font-bold text-ink">
          N
        </span>
        <span className={cn('font-display text-lg font-bold tracking-[-0.01em] text-paper', labelCls)}>
          Naqsha
        </span>
      </div>

      {/* Items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label={`${ROLE_LABEL[role]} sections`}>
        {items.map((item) => {
          const Icon = item.icon;
          const badge = badges[item.key] ?? item.badge;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded px-3 py-2.5 font-display text-[13px] font-medium text-[#B4AB9A]',
                  'hover:bg-ink-2 hover:text-paper',
                  isActive && 'bg-ink-2 text-saffron',
                )
              }
            >
              <span className="relative shrink-0">
                <Icon size={18} />
                {badge && (
                  <span
                    className={cn(
                      'absolute -right-1.5 -top-1.5 rounded-full px-1 py-px font-mono text-[8px] font-semibold text-paper',
                      BADGE_TONE[badge.tone],
                    )}
                  >
                    {badge.count}
                  </span>
                )}
              </span>
              <span className={cn('truncate', labelCls)}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Identity + logout */}
      <div className="border-t border-ink-3 px-2 py-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal font-display text-[13px] font-semibold text-paper">
            {(user?.fullName ?? ROLE_LABEL[role]).charAt(0)}
          </span>
          <div className={cn('min-w-0', labelCls)}>
            <div className="truncate text-[13px] font-semibold text-paper">{user?.fullName ?? '—'}</div>
            <div className="font-mono text-[10px] uppercase tracking-ref text-line-2">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded px-3 py-2 font-display text-[13px] font-medium text-[#B4AB9A] hover:bg-ink-2 hover:text-paper"
        >
          <LogOut size={16} className="shrink-0" />
          <span className={labelCls}>Sign out</span>
        </button>
      </div>
    </div>
  );
}

import {
  LayoutGrid,
  MonitorPlay,
  ReceiptText,
  UtensilsCrossed,
  Package,
  Truck,
  Users,
  Megaphone,
  CalendarClock,
  Trash2,
  Video,
  BarChart3,
  UsersRound,
  Coffee,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/domain';

export type NavBadge = { count: number; tone: 'alert' | 'amber' };
export type NavItem = { key: string; label: string; icon: LucideIcon; to: string; badge?: NavBadge };

/**
 * Badge counts are NOT declared here.
 *
 * They used to be literals — KDS 7, Inventory 6, Wastage 3 — which meant the sidebar
 * asserted six low-stock items on a site with one, and never changed no matter what
 * happened. `useNavBadges` supplies them live and keys them by `NavItem.key`.
 */

/** Per-role sidebar contents. Every route here is also allowed for that role in ROUTE_ROLES. */
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  waiter: [
    { key: 'floor', label: 'Floor', icon: LayoutGrid, to: '/waiter/tables' },
    { key: 'resv', label: 'Reservations', icon: CalendarClock, to: '/manager/reservations' },
  ],
  kitchen: [
    { key: 'drinks', label: 'Drinks', icon: Coffee, to: '/kds/drinks' },
    { key: 'main', label: 'Main', icon: UtensilsCrossed, to: '/kds/main' },
    { key: 'bbq', label: 'BBQ', icon: Flame, to: '/kds/bbq' },
    { key: 'agg', label: 'Aggregate', icon: MonitorPlay, to: '/manager/kds' },
  ],
  manager: [
    { key: 'floor', label: 'Floor', icon: LayoutGrid, to: '/manager/floor' },
    { key: 'kds', label: 'KDS', icon: MonitorPlay, to: '/manager/kds' },
    { key: 'pos', label: 'POS', icon: ReceiptText, to: '/manager/pos' },
    { key: 'menu', label: 'Menu', icon: UtensilsCrossed, to: '/manager/menu' },
    { key: 'stock', label: 'Inventory', icon: Package, to: '/manager/inventory' },
    { key: 'buy', label: 'Purchasing', icon: Truck, to: '/manager/purchasing' },
    { key: 'cust', label: 'Customers', icon: Users, to: '/manager/customers' },
    { key: 'mkt', label: 'Marketing', icon: Megaphone, to: '/manager/marketing' },
    { key: 'resv', label: 'Reservations', icon: CalendarClock, to: '/manager/reservations' },
    { key: 'wast', label: 'Wastage', icon: Trash2, to: '/manager/wastage' },
    { key: 'cam', label: 'Cameras', icon: Video, to: '/manager/cameras' },
  ],
  owner: [
    { key: 'dash', label: 'Dashboard', icon: LayoutGrid, to: '/owner/dashboard' },
    { key: 'reports', label: 'Reports', icon: BarChart3, to: '/owner/reports' },
    { key: 'wast', label: 'Wastage', icon: Trash2, to: '/owner/wastage' },
    { key: 'staff', label: 'Staff & payroll', icon: UsersRound, to: '/owner/staff' },
  ],
};

/**
 * Route access for the auth guard — most-specific prefix first. Roles not listed
 * are denied and redirected to their own home. Public routes are handled outside
 * the guard (see App.tsx).
 */
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: '/manager/reservations', roles: ['waiter', 'manager'] },
  { prefix: '/manager/kds', roles: ['kitchen', 'manager'] },
  { prefix: '/manager', roles: ['manager'] },
  { prefix: '/waiter', roles: ['waiter', 'manager'] },
  { prefix: '/kds', roles: ['kitchen', 'manager'] },
  { prefix: '/owner', roles: ['owner'] },
];

/** Roles allowed on a path, or null if the path is not guarded (public). */
export function rolesForPath(pathname: string): Role[] | null {
  const hit = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
  return hit ? hit.roles : null;
}

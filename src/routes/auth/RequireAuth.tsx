import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLE_HOME, useSessionStore } from '@/stores/session';
import { rolesForPath } from '@/components/layouts/navConfig';
import { RouteFallback } from '@/components/naqsha/RouteFallback';
import { useRealtimeBridge } from '@/hooks/useRealtimeBridge';
import { useNotifications } from '@/hooks/useNotifications';
import { ToastHost } from '@/components/naqsha/ToastHost';

/**
 * Route guard for the staff app. Public customer routes (order / feedback / kiosk)
 * are deliberately not wrapped by this, so they never wait on a session.
 *
 * The `status === 'unknown'` gate matters: on a cold load the sid cookie has not been
 * exchanged for a session yet, and without it every hard refresh would bounce a
 * signed-in user to /login for one round trip.
 *
 * This is also where the realtime bridge mounts — inside the auth boundary, so a
 * logged-out browser never opens a socket.
 */
export function RequireAuth() {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  const location = useLocation();

  useRealtimeBridge();
  useNotifications();

  if (status === 'unknown') return <RouteFallback />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowed = rolesForPath(location.pathname);
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  // ToastHost lives here rather than in each shell: the manager, waiter and kitchen
  // shells are separate components, and a toast layer mounted per-shell would vanish on
  // any navigation that crosses between them.
  return (
    <>
      <Outlet />
      <ToastHost />
    </>
  );
}

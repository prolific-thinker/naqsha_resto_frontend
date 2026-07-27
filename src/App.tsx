import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteFallback } from './components/naqsha/RouteFallback';
import { RequireAuth } from './routes/auth/RequireAuth';
import { ROLE_HOME, useSessionStore } from './stores/session';

// Every route is a lazy import so kiosks pull only their role's chunk on cold
// load (handover §6). Route components use default exports (React Router).
const Login = lazy(() => import('./routes/auth/login'));
const DevGallery = lazy(() => import('./routes/dev/components'));
const WaiterFloor = lazy(() => import('./routes/waiter/floor'));
const WaiterMenuCart = lazy(() => import('./routes/waiter/menu-cart'));
const KdsStation = lazy(() => import('./routes/kds/station'));
const ManagerFloor = lazy(() => import('./routes/manager/floor'));
const ManagerKdsAggregate = lazy(() => import('./routes/manager/kds-aggregate'));
const ManagerPos = lazy(() => import('./routes/manager/pos'));
const ManagerWastage = lazy(() => import('./routes/manager/wastage'));
const ManagerCameras = lazy(() => import('./routes/manager/cameras'));
const OwnerDashboard = lazy(() => import('./routes/owner/dashboard'));
const OwnerWastageApprovals = lazy(() => import('./routes/owner/wastage-approvals'));
const CustomerFeedback = lazy(() => import('./routes/feedback/customer'));

// ERPNext-backed feature set
const ManagerMenu = lazy(() => import('./routes/manager/menu'));
const ManagerInventory = lazy(() => import('./routes/manager/inventory'));
const ManagerPurchasing = lazy(() => import('./routes/manager/purchasing'));
const ManagerCustomers = lazy(() => import('./routes/manager/customers'));
const ManagerMarketing = lazy(() => import('./routes/manager/marketing'));
const ManagerReservations = lazy(() => import('./routes/manager/reservations'));
const OwnerReports = lazy(() => import('./routes/owner/reports'));
const OwnerStaff = lazy(() => import('./routes/owner/staff'));
const CustomerOrder = lazy(() => import('./routes/customer/order'));
const Kiosk = lazy(() => import('./routes/kiosk/kiosk'));

/** Send "/" to the signed-in role's home, or the login screen when signed out. */
function RootRedirect() {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  // Wait for bootstrap, or a hard refresh on "/" bounces a signed-in user to /login.
  if (status === 'unknown') return <RouteFallback />;
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* Public — customer & dev (no auth) */}
        <Route path="/dev/components" element={<DevGallery />} />
        <Route path="/feedback/:tableSlug" element={<CustomerFeedback />} />
        <Route path="/order/:tableSlug" element={<CustomerOrder />} />
        <Route path="/kiosk" element={<Kiosk />} />

        {/* Staff — behind auth + role gating (see RequireAuth + navConfig) */}
        <Route element={<RequireAuth />}>
          {/* A — Waiter tablet */}
          <Route path="/waiter/tables" element={<WaiterFloor />} />
          <Route path="/waiter/tables/:tableId" element={<WaiterMenuCart />} />

          {/* K — Kitchen display */}
          <Route path="/kds/:station" element={<KdsStation />} />

          {/* M — Manager console */}
          <Route path="/manager/floor" element={<ManagerFloor />} />
          <Route path="/manager/kds" element={<ManagerKdsAggregate />} />
          {/* Bare /manager/pos is the table picker; the billing screen needs a table. */}
          <Route path="/manager/pos" element={<ManagerPos />} />
          <Route path="/manager/pos/:tableId" element={<ManagerPos />} />
          <Route path="/manager/wastage" element={<ManagerWastage />} />
          <Route path="/manager/cameras" element={<ManagerCameras />} />
          <Route path="/manager/menu" element={<ManagerMenu />} />
          <Route path="/manager/inventory" element={<ManagerInventory />} />
          <Route path="/manager/purchasing" element={<ManagerPurchasing />} />
          <Route path="/manager/customers" element={<ManagerCustomers />} />
          <Route path="/manager/marketing" element={<ManagerMarketing />} />
          <Route path="/manager/reservations" element={<ManagerReservations />} />

          {/* O — Owner portal */}
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/wastage" element={<OwnerWastageApprovals />} />
          <Route path="/owner/reports" element={<OwnerReports />} />
          <Route path="/owner/staff" element={<OwnerStaff />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteFallback } from './components/naqsha/RouteFallback';

// Every route is a lazy import so kiosks pull only their role's chunk on cold
// load (handover §6). Route components use default exports (React Router).
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

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dev/components" replace />} />
        <Route path="/dev/components" element={<DevGallery />} />

        {/* A — Waiter tablet */}
        <Route path="/waiter/tables" element={<WaiterFloor />} />
        <Route path="/waiter/tables/:tableId" element={<WaiterMenuCart />} />

        {/* K — Kitchen display */}
        <Route path="/kds/:station" element={<KdsStation />} />

        {/* M — Manager console */}
        <Route path="/manager/floor" element={<ManagerFloor />} />
        <Route path="/manager/kds" element={<ManagerKdsAggregate />} />
        <Route path="/manager/pos/:tableId" element={<ManagerPos />} />
        <Route path="/manager/wastage" element={<ManagerWastage />} />
        <Route path="/manager/cameras" element={<ManagerCameras />} />

        {/* O — Owner portal */}
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/wastage" element={<OwnerWastageApprovals />} />

        {/* C — Customer feedback (public, no auth) */}
        <Route path="/feedback/:tableSlug" element={<CustomerFeedback />} />

        <Route path="*" element={<Navigate to="/dev/components" replace />} />
      </Routes>
    </Suspense>
  );
}

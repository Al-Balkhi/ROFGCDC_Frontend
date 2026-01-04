import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastContainer';
import PageLoader from './components/PageLoader';
import { ROLES } from './constants/roles';
import { useEffect } from 'react';
import { initCSRF } from './services/api';

// Layout components - keep as eager imports for better initial load
import AdminDashboardLayout from './layouts/AdminDashboardLayout';
import PlannerDashboardLayout from './layouts/PlannerDashboardLayout';

// Lazy load all route components for code splitting
const Login = lazy(() => import('./routes/Login'));
const Activate = lazy(() => import('./routes/Activate'));
const ForgotPassword = lazy(() => import('./routes/ForgotPassword'));
const ResetPassword = lazy(() => import('./routes/ResetPassword'));
const AdminDashboard = lazy(() => import('./routes/AdminDashboard'));
const PlannerDashboard = lazy(() => import('./routes/PlannerDashboard'));
const Profile = lazy(() => import('./routes/Profile'));
const Users = lazy(() => import('./routes/Users'));
const Bins = lazy(() => import('./routes/Bins'));
const Vehicles = lazy(() => import('./routes/Vehicles'));
const ActivityLog = lazy(() => import('./routes/ActivityLog'));
const Municipality = lazy(() => import('./routes/Municipality'));
const Landfill = lazy(() => import('./routes/Landfill'));
const PlannerScenarios = lazy(() => import('./routes/PlannerScenarios'));
const PlannerSolutions = lazy(() => import('./routes/PlannerSolutions'));

function App() {
  useEffect(() => {
    initCSRF();
  }, []);
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes - Admin only */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <AdminDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="municipalities" element={<Municipality />} />
              <Route path="landfills" element={<Landfill />} />
              <Route path="bins" element={<Bins />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="activity-log" element={<ActivityLog />} />
            </Route>

            {/* Protected routes - Planner only */}
            <Route
              path="/dashboard/planner"
              element={
                <ProtectedRoute requiredRole={ROLES.PLANNER}>
                  <PlannerDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PlannerDashboard />} />
              <Route path="scenarios" element={<PlannerScenarios />} />
              <Route path="solutions" element={<PlannerSolutions />} />
              <Route path="solutions/:solutionId" element={<PlannerSolutions />} />
            </Route>

            {/* Protected routes - All authenticated users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

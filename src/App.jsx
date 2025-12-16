import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastContainer';
import AdminDashboardLayout from './layouts/AdminDashboardLayout';
import PlannerDashboardLayout from './layouts/PlannerDashboardLayout';
import Login from './routes/Login';
import Activate from './routes/Activate';
import ForgotPassword from './routes/ForgotPassword';
import ResetPassword from './routes/ResetPassword';
import AdminDashboard from './routes/AdminDashboard';
import PlannerDashboard from './routes/PlannerDashboard';
import Profile from './routes/Profile';
import Users from './routes/Users';
import Bins from './routes/Bins';
import Vehicles from './routes/Vehicles';
import ActivityLog from './routes/ActivityLog';
import Municipality from './routes/Municipality';
import Landfill from './routes/Landfill';
import PlannerScenarios from './routes/PlannerScenarios';
import PlannerSolutions from './routes/PlannerSolutions';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
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
            <ProtectedRoute requiredRole="admin">
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
            <ProtectedRoute requiredRole="planner">
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
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

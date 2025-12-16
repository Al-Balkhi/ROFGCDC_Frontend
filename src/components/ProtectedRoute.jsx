import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  // Wait for initialization to complete
  if (loading) {
    return null;
  }

  // If not authenticated after loading, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">غير مسموح</h1>
          <p className="text-gray-600 mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Navigate to="/login" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;


// src/components/admin/AdminRoute.jsx — FIXED (redirect to admin login, not customer login)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, hasAdminAccess, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated || !hasAdminAccess) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
// src/pages/Profile.jsx — REDESIGNED (pink admin CTA, hover/focus feedback on list rows, radius token on admin button)
import { Link, Navigate } from 'react-router-dom';
import { LogOut, Package, Heart, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/profile' }} replace />;
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-md mx-auto pb-20 md:pb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <User size={24} className="text-primary-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {isAdmin && (
        <Link
          to="/admin/products"
          className="focus-ring press-scale flex items-center gap-3 py-3 px-4 mb-4 rounded-[var(--radius-md)] bg-primary-500 text-white text-sm font-medium shadow-xs hover:bg-primary-600 transition-colors duration-150"
        >
          <LayoutDashboard size={18} />
          Go to Admin Dashboard
        </Link>
      )}

      <div className="flex flex-col divide-y divide-gray-200 border-y border-gray-200">
        <Link to="/my-orders" className="focus-ring flex items-center gap-3 py-4 px-1 text-sm text-gray-900 rounded-[var(--radius-sm)] hover:bg-gray-50 transition-colors duration-150">
          <Package size={18} className="text-gray-500" />
          My Orders
        </Link>
        <Link to="/wishlist" className="focus-ring flex items-center gap-3 py-4 px-1 text-sm text-gray-900 rounded-[var(--radius-sm)] hover:bg-gray-50 transition-colors duration-150">
          <Heart size={18} className="text-gray-500" />
          Wishlist
        </Link>
        <button onClick={logout} className="focus-ring flex items-center gap-3 py-4 px-1 text-sm text-error text-left rounded-[var(--radius-sm)] hover:bg-error-light transition-colors duration-150">
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}
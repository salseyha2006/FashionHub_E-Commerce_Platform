// src/pages/admin/AdminLogin.jsx — REDESIGNED (surface card, pink primary CTA, focus-ring inputs, matches AdminLayout sidebar branding)
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { login, isAuthenticated, hasAdminAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && hasAdminAccess) {
    return <Navigate to={location.state?.from || '/admin/dashboard'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== 'admin' && user.role !== 'staff') {
        setError('This account does not have admin access.');
        return;
      }
      navigate(location.state?.from || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-sm p-6">
        <div className="flex flex-col items-center text-center mb-8">
          <span className="h-9 w-9 rounded-[var(--radius-md)] bg-[image:var(--gradient-primary)] mb-3" aria-hidden="true" />
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Thida Shop</p>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mt-1">Admin Dashboard</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
            />
          </label>

          {error && (
            <p className="text-xs text-error bg-error-light rounded-[var(--radius-sm)] px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring press-scale mt-2 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
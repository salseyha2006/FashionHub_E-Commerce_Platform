// src/pages/Login.jsx — REDESIGNED (2026 pink SaaS: rounded inputs w/ focus-glow ring, surface card, solid pink primary button)
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      showToast('Welcome back.', 'success');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-gray-25">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Log in</h1>
          <p className="text-sm text-gray-500 mt-1.5">Welcome back to Thida Shop</p>
        </div>

        <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring press-scale mt-2 w-full py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-gray-900 font-medium underline underline-offset-2 hover:text-primary-600 transition-colors duration-150">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <input
        id={name}
        name={name}
        {...props}
        className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
      />
    </label>
  );
}
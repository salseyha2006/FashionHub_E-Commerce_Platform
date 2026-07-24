// src/pages/Register.jsx — REDESIGNED (same pattern as Login.jsx: rounded inputs w/ focus-glow, surface card, solid pink primary button)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.phone || undefined);
      showToast('Account created. Welcome to Thida Shop.', 'success');
      navigate('/', { replace: true });
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
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sign up</h1>
          <p className="text-sm text-gray-500 mt-1.5">Create your Thida Shop account</p>
        </div>

        <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Name" name="name" value={form.name} onChange={handleChange} autoComplete="name" required />
            <Field label="Email" type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            <Field label="Phone (optional)" type="tel" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" />
            <Field
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring press-scale mt-2 w-full py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-900 font-medium underline underline-offset-2 hover:text-primary-600 transition-colors duration-150">
            Log in
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
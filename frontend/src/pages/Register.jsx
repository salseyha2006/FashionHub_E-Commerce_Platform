// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim() || undefined);
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
            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              hint="At least 8 characters"
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

function PasswordField({ label, name, visible, onToggleVisible, hint, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          {...props}
          className="focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] pl-3.5 pr-10 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="focus-ring absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}
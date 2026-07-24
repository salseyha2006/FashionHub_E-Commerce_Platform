// src/components/layout/MobileMenu.jsx — REDESIGNED (clean wordmark, list-style nav, solid pink primary CTA)
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/wishlist', label: 'Wishlist' },
];

export default function MobileMenu({ open, onClose }) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-40 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-surface z-50 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200">
          <span className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-[6px] bg-[image:var(--gradient-primary)]" aria-hidden="true" />
            <span className="text-base font-semibold tracking-tight text-gray-900">
              Thida<span className="text-primary-500"> Shop</span>
            </span>
          </span>
          <button
            onClick={onClose}
            className="focus-ring press-scale p-2 -mr-2 rounded-[var(--radius-md)] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex flex-col px-3 py-3 gap-0.5">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className="focus-ring px-3 py-2.5 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pt-2 mt-2 border-t border-gray-200">
          {isAuthenticated ? (
            <div className="flex flex-col gap-0.5 pt-2">
              <Link
                to="/profile"
                onClick={onClose}
                className="focus-ring px-3 py-2.5 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              >
                {user?.name || 'Profile'}
              </Link>
              <button
                onClick={() => { logout(); onClose(); }}
                className="focus-ring px-3 py-2.5 text-sm font-medium text-left text-gray-500 rounded-[var(--radius-md)] hover:bg-error-light hover:text-error transition-colors duration-150"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3 px-1">
              <Link
                to="/login"
                onClick={onClose}
                className="focus-ring press-scale text-center py-2.5 rounded-[var(--radius-md)] border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="focus-ring press-scale text-center py-2.5 rounded-[var(--radius-md)] bg-primary-500 text-sm font-medium text-white shadow-xs hover:bg-primary-600 transition-colors duration-150"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
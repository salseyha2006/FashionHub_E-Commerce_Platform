// src/components/layout/TopNav.jsx — REDESIGNED (Linear/Stripe-style: understated text nav + underline, no filled pills)
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../hooks/useSettings';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/wishlist', label: 'Wishlist' },
];

export default function TopNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { settings } = useSettings();
  const storeName = settings?.storeName || 'FashionHub';

  return (
    <header className="hidden md:flex fixed top-0 inset-x-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-b border-gray-200 items-center px-8 lg:px-12">
      <Link to="/" className="focus-ring flex items-center gap-2 rounded-[var(--radius-sm)] shrink-0">
        <span className="h-6 w-6 rounded-[7px] bg-[image:var(--gradient-primary)]" aria-hidden="true" />
        <span className="text-lg font-semibold tracking-tight text-gray-900">
          {storeName}
        </span>
      </Link>

      <nav className="flex items-center gap-1 mx-auto">
        {LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `focus-ring relative px-3.5 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors duration-150 ${
                isActive
                  ? 'text-gray-900 after:absolute after:left-3.5 after:right-3.5 after:-bottom-[1px] after:h-[2px] after:bg-primary-500 after:rounded-full'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `focus-ring ml-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/cart"
          className="focus-ring press-scale relative p-2 rounded-[var(--radius-md)] text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          aria-label="View cart"
        >
          <ShoppingBag size={19} strokeWidth={1.75} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] leading-4 text-center font-semibold">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </Link>

        {isAuthenticated ? (
          <Link
            to="/profile"
            className="focus-ring press-scale p-2 rounded-[var(--radius-md)] text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            aria-label="Profile"
          >
            <User size={19} strokeWidth={1.75} />
          </Link>
        ) : (
          <div className="flex items-center gap-2 ml-1">
            <Link
              to="/login"
              className="focus-ring press-scale px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="focus-ring press-scale px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
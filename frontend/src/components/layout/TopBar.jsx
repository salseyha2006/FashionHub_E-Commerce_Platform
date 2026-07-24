// src/components/layout/TopBar.jsx — REDESIGNED (2026 pink SaaS: clean wordmark, ghost icon buttons, no italic serif)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShoppingBag } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { useCart } from '../../context/CartContext';

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();

  return (
    <header className="md:hidden fixed top-0 inset-x-0 z-30 h-16 bg-surface border-b border-gray-200 flex items-center justify-between px-4">
      <button
        onClick={() => setMenuOpen(true)}
        className="focus-ring press-scale p-2 -ml-2 rounded-[var(--radius-md)] text-gray-700 hover:bg-gray-100 transition-colors duration-150"
        aria-label="Open menu"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <Link
        to="/"
        className="focus-ring absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-[var(--radius-sm)]"
      >
        <span className="h-5 w-5 rounded-[6px] bg-[image:var(--gradient-primary)] shrink-0" aria-hidden="true" />
        <span className="text-base font-semibold tracking-tight text-gray-900">
          Thida<span className="text-primary-500"> Shop</span>
        </span>
      </Link>

      <Link
        to="/cart"
        className="focus-ring press-scale relative p-2 -mr-2 rounded-[var(--radius-md)] text-gray-700 hover:bg-gray-100 transition-colors duration-150"
        aria-label="View cart"
      >
        <ShoppingBag size={20} strokeWidth={1.75} />
        {cartCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] leading-4 text-center font-semibold">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
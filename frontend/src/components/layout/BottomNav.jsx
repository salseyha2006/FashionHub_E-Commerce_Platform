// src/components/layout/BottomNav.jsx — REDESIGNED (2026 pink SaaS: pink icon fill on active, no dark pill background)
import { NavLink } from 'react-router-dom';
import { Home, Grid2x2, Heart, User } from 'lucide-react';

const TABS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/shop', icon: Grid2x2, label: 'Shop' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-t border-gray-200 grid grid-cols-4">
      {TABS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="focus-ring flex flex-col items-center justify-center gap-1"
        >
          {({ isActive }) => (
            <>
              <span className="relative flex items-center justify-center h-7 w-7">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={`transition-colors duration-150 ${isActive ? 'text-primary-500' : 'text-gray-400'}`}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary-500"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={`text-[10px] tracking-wide transition-colors duration-150 ${
                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'
                }`}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
// src/components/admin/AdminLayout.jsx — Phase 12: nav items filtered by permission
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, ShoppingCart, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Categories & Banners moved into Settings (Store section) — no longer
// top-level nav items. Their pages/CRUD now live at /admin/settings.
const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
  { to: '/admin/pos', label: 'POS', icon: ShoppingCart, permission: 'use_pos' },
  { to: '/admin/products', label: 'Products', icon: Package, permission: 'manage_products' },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, permission: 'manage_orders' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: 'manage_settings' },
];

export default function AdminLayout() {
  const { hasPermission } = useAuth();
  // The owner (role=admin) always passes hasPermission for every key, so
  // this only actually filters anything down for role=staff accounts.
  //
  // Special case: Categories & Banners now live as tabs inside Settings.
  // A staff member granted only manage_categories/manage_banners (and NOT
  // manage_settings) still needs a way to reach those tabs, so the
  // Settings link stays visible for them too — the Settings page itself
  // filters which tabs actually render based on the same permissions.
  const links = LINKS.filter((l) => {
    if (l.to === '/admin/settings') {
      return hasPermission('manage_settings') || hasPermission('manage_categories') || hasPermission('manage_banners');
    }
    return hasPermission(l.permission);
  });

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="flex flex-col md:flex-row">
        {/* Desktop/tablet: left sidebar (md and up) */}
        <aside className="hidden md:block md:w-60 shrink-0 md:border-r border-gray-200 bg-surface md:min-h-screen">
          <div className="px-4 md:px-6 py-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-[7px] bg-[image:var(--gradient-primary)] shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-500 leading-tight">Thida Shop</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Admin</p>
            </div>
          </div>
          <nav className="flex flex-col px-3 pb-6 gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `focus-ring relative flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-primary-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile top bar: just the brand, since nav moves to the bottom tab bar */}
        <div className="md:hidden px-4 py-3 flex items-center gap-2 border-b border-gray-200 bg-surface">
          <span className="h-6 w-6 rounded-[7px] bg-[image:var(--gradient-primary)] shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500 leading-tight">Thida Shop</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Admin</p>
          </div>
        </div>

        <main className="flex-1 px-4 md:px-8 py-6 pb-20 md:pb-6 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile: bottom tab bar instead of horizontal-scroll nav, easier to reach with a thumb */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-t border-gray-200 grid"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="focus-ring flex flex-col items-center justify-center gap-1">
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={`transition-colors duration-150 ${isActive ? 'text-primary-500' : 'text-gray-400'}`}
                />
                <span className={`text-[9px] tracking-wide leading-none transition-colors duration-150 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

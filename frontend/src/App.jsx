// src/App.jsx — UPDATED with Telegram Native Back Button & Mini App Configurations
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';

import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPOS from './pages/admin/AdminPOS';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';

import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminSettings from './pages/admin/AdminSettings';
import { useAuth } from './context/AuthContext';
import { useSettings } from './hooks/useSettings';

// Component សម្រាប់គ្រប់គ្រង Telegram Native Back Button តាម Path/Route
function TelegramBackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // បញ្ជី Path ដើម ដែលមិនត្រូវបង្ហាញ Back Button ឡើយ
    const rootPaths = ['/', '/admin/dashboard', '/admin/login'];
    const isRoot = rootPaths.includes(location.pathname);

    if (!isRoot) {
      // បើស្ថិតនៅទំព័របន្ទាប់បន្សំ (Sub-pages) ត្រូវបង្ហាញ Native Back Button របស់ Telegram
      tg.BackButton.show();

      const handleBackClick = () => {
        navigate(-1); // ថយក្រោយ ១ ទំព័រ
      };

      tg.BackButton.onClick(handleBackClick);

      return () => {
        tg.BackButton.offClick(handleBackClick);
      };
    } else {
      // បើនៅទំព័រដើម ត្រូវលាក់ Back Button
      tg.BackButton.hide();
    }
  }, [location.pathname, navigate]);

  return null;
}

// Phase 13 — System settings: when Admin flips maintenanceMode on, shoppers
// see a simple holding page instead of the storefront. Admin/staff accounts
// bypass this entirely so the owner can keep working (and turn it back off)
// while it's active.
function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center bg-gray-25">
      <div>
        <span className="h-10 w-10 rounded-[var(--radius-md)] bg-[image:var(--gradient-primary)] inline-block mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">We'll be back soon</h1>
        <p className="text-sm text-gray-500 max-w-sm">We're making some updates to the store right now. Please check back shortly.</p>
      </div>
    </div>
  );
}

function MaintenanceGate({ children }) {
  const { settings } = useSettings();
  const { hasAdminAccess } = useAuth();
  if (settings?.maintenanceMode && !hasAdminAccess) {
    return <MaintenancePage />;
  }
  return children;
}

function CustomerShell() {
  return (
    <Layout>
      <MaintenanceGate>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/my-orders/:id" element={<OrderDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      </MaintenanceGate>
    </Layout>
  );
}

export default function App() {
  // Config Telegram Mini App Behavior
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand(); // បង្ខំឱ្យបើកពេញអេក្រង់ Fullscreen

      // បន្ថែម Class ទៅ body សម្រាប់ CSS លាក់ Header Title (វិធីសាស្ត្រទី ២)
      if (tg.initData) {
        document.body.classList.add('is-telegram');
      }

      // 🚫 បិទ Gesture Swipe ចុះក្រោម កុំឱ្យរបូត App ធ្លាក់មកក្រោម
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }

      // សួរបញ្ជាក់មុនពេលចាកចេញ (ជួយការពារ Swipe បិទ App ដោយអចេតនា)
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }

      // ប្ដូរពណ៌ Telegram Header ខាងលើទៅជាពណ៌ស
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#FFFFFF');
      }

      // កំណត់ Background color របស់ Telegram container
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#FFFFFF');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      {/* ហៅ Back Button Handler ឱ្យដើរក្នុង BrowserRouter Context */}
      <TelegramBackButtonHandler />

      <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Routes>
                {/* Admin: no customer TopBar/BottomNav — its own layout entirely */}
                <Route path="/admin/login" element={<AdminLogin />} />
                {/* POS runs full-screen (own header, no sidebar) — kept outside AdminLayout on purpose */}
                <Route path="/admin/pos" element={<AdminRoute><AdminPOS /></AdminRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<AdminProductForm />} />
                  <Route path="products/:id/edit" element={<AdminProductForm />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<AdminOrderDetail />} />
                  <Route path="categories" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="banners" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="banners/new" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="banners/:id/edit" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Everything else: customer-facing, wrapped in the shared Layout */}
                <Route path="/*" element={<CustomerShell />} />
              </Routes>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
// src/pages/admin/AdminDashboard.jsx — REDESIGNED (2026 pink SaaS: shimmer loading state, elevated stat cards, gradient bar chart, styled empty/error states)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, AlertTriangle, PartyPopper } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/orders/StatusBadge';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-[var(--radius-md)] bg-primary-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function SalesChart({ data }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No sales data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-3 h-40 border-b border-gray-200 pb-0">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end justify-center h-32">
            <div
              className="w-full max-w-[36px] rounded-t-[var(--radius-sm)] transition-all duration-300"
              style={{
                height: `${Math.max((d.total / max) * 100, 3)}%`,
                background: 'var(--gradient-primary)',
              }}
              title={`$${d.total.toFixed(2)}`}
            />
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-medium">{d.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="h-6 w-32 rounded animate-shimmer mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[70px] rounded-[var(--radius-lg)] animate-shimmer" />
        ))}
      </div>
      <div className="h-56 rounded-[var(--radius-lg)] animate-shimmer mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-40 rounded-[var(--radius-md)] animate-shimmer" />
        <div className="h-40 rounded-[var(--radius-md)] animate-shimmer" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/dashboard', { token })
      .then(setStats)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [token, showToast]);

  if (loading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="h-11 w-11 rounded-full bg-error-light flex items-center justify-center">
          <AlertTriangle size={20} className="text-error" />
        </div>
        <p className="text-sm font-medium text-gray-900">Couldn't load dashboard</p>
        <p className="text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Today's Sales" value={`$${stats.todaySales.toFixed(2)}`} />
        <StatCard icon={ShoppingBag} label="Orders Today" value={stats.ordersToday} />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStockCount} />
      </div>

      <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 mb-8">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">Sales — last 6 months</p>
        <SalesChart data={stats.monthlySales} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">Low stock alert</p>
          {stats.lowStockItems.length === 0 ? (
            <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs px-4 py-6 flex items-center gap-2 justify-center text-center">
              <PartyPopper size={16} className="text-gray-400" />
              <p className="text-sm text-gray-500">Nothing running low.</p>
            </div>
          ) : (
            <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs divide-y divide-gray-200 overflow-hidden">
              {stats.lowStockItems.map((item, i) => (
                <Link
                  key={i}
                  to={`/admin/products/${item.productId}/edit`}
                  className="focus-ring flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150"
                >
                  <span className="text-gray-900">
                    {item.productName}
                    <span className="text-gray-500"> — {item.size}, {item.color}</span>
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-error-light text-error shrink-0">
                    {item.stockQuantity} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">Recent orders</p>
          {stats.recentOrders.length === 0 ? (
            <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No orders yet.</p>
            </div>
          ) : (
            <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs divide-y divide-gray-200 overflow-hidden">
              {stats.recentOrders.map((o) => (
                <Link
                  key={o.id}
                  to={`/admin/orders/${o.id}`}
                  className="focus-ring flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150"
                >
                  <span className="text-gray-900">#{o.orderNumber}</span>
                  <StatusBadge status={o.status} />
                  <span className="text-gray-900 font-medium shrink-0">${Number(o.totalAmount).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
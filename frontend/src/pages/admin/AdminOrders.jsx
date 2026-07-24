// src/pages/admin/AdminOrders.jsx — REDESIGNED (surface card table matching AdminProducts.jsx, status colors aligned with StatusBadge.jsx's semantic palette instead of an ad hoc gray/pink/black scheme)
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-error-light text-error',
};
const PAGE_SIZE = 20;

export default function AdminOrders() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 'YYYY-MM-DD', '' = all dates
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter) params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (dateFilter) {
        // A single calendar day, expressed as [00:00, next day 00:00) in the
        // browser's local time zone — this is what "look up today's/that
        // day's orders" means to a cashier, not a raw UTC day boundary.
        const start = new Date(`${dateFilter}T00:00:00`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        params.set('dateFrom', start.toISOString());
        params.set('dateTo', end.toISOString());
      }
      const data = await apiClient.get(`/admin/orders?${params.toString()}`, { token });
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Debounce raw keystrokes into a settled search term.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Any filter change invalidates the current page (page 2 of "pending"
  // orders isn't page 2 of "all" orders) — jump back to page 1 for it.
  useEffect(() => { setPage(1); }, [statusFilter, dateFilter, debouncedSearch]);

  // The single source of truth for fetching — reacts to page changes (Prev/
  // Next, or the resets above) and to every settled filter value.
  useEffect(() => { loadOrders(); }, [page, statusFilter, dateFilter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(orderId, nextStatus) {
    setUpdatingId(orderId);
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, { status: nextStatus }, { token });
      showToast('Order status updated.', 'success');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">Orders</h1>
        {pagination.total > 0 && (
          <p className="text-xs text-gray-500">{pagination.total} order{pagination.total === 1 ? '' : 's'} total</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, phone, or name…"
            className="focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] pl-9 pr-9 py-2 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-gray-900 bg-surface"
          title="Filter by day"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="focus-ring text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-2"
          >
            Clear date
          </button>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-gray-900 bg-surface"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-[var(--radius-lg)] overflow-hidden border border-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-shimmer border-b border-gray-200 last:border-b-0" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs px-4 py-10 text-center">
          <p className="text-sm text-gray-500">
            {search || dateFilter || statusFilter ? 'No orders match these filters.' : 'No orders found.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop/tablet: full table (md and up) */}
          <div className="hidden md:block bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-medium">Order #</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      <Link to={`/admin/orders/${o.id}`} className="focus-ring font-medium underline underline-offset-2 hover:text-primary-600 transition-colors duration-150">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.customerName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{o.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate" title={o.shippingAddress || ''}>
                      {o.shippingAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">${Number(o.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {NEXT_STATUSES[o.status].length === 0 ? (
                        <span className="text-xs text-gray-400 text-right block">—</span>
                      ) : (
                        <select
                          defaultValue=""
                          disabled={updatingId === o.id}
                          onChange={(e) => e.target.value && handleStatusChange(o.id, e.target.value)}
                          className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-gray-900 bg-surface disabled:opacity-40"
                        >
                          <option value="">Move to…</option>
                          {NEXT_STATUSES[o.status].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards instead of a horizontally-scrolling table */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4">
                <div className="flex items-start justify-between mb-2.5">
                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="focus-ring font-medium text-gray-900 underline underline-offset-2"
                  >
                    {o.orderNumber}
                  </Link>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${STATUS_STYLES[o.status]}`}>
                    {o.status}
                  </span>
                </div>

                <dl className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-sm mb-3">
                  <dt className="text-gray-400 text-xs">Customer</dt>
                  <dd className="col-span-2 text-gray-700">{o.customerName || '—'}</dd>

                  <dt className="text-gray-400 text-xs">Phone</dt>
                  <dd className="col-span-2 text-gray-700">{o.phone || '—'}</dd>

                  <dt className="text-gray-400 text-xs">Address</dt>
                  <dd className="col-span-2 text-gray-700 truncate" title={o.shippingAddress || ''}>
                    {o.shippingAddress || '—'}
                  </dd>

                  <dt className="text-gray-400 text-xs">Date</dt>
                  <dd className="col-span-2 text-gray-700">{new Date(o.createdAt).toLocaleDateString()}</dd>
                </dl>

                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <span className="text-base font-semibold text-gray-900">${Number(o.totalAmount).toFixed(2)}</span>
                  {NEXT_STATUSES[o.status].length === 0 ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <select
                      defaultValue=""
                      disabled={updatingId === o.id}
                      onChange={(e) => e.target.value && handleStatusChange(o.id, e.target.value)}
                      className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-gray-900 bg-surface disabled:opacity-40 min-h-[44px]"
                    >
                      <option value="">Move to…</option>
                      {NEXT_STATUSES[o.status].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="focus-ring px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-150"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="focus-ring px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-150"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
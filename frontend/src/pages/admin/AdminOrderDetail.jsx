// src/pages/admin/AdminOrderDetail.jsx — REDESIGNED (surface cards, shimmer loading, pink primary CTA, error-light states)
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Printer } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/orders/StatusBadge';
import OrderProgress from '../../components/orders/OrderProgress';

const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function Section({ label, children }) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">{label}</p>
      {children}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-lg">
      <div className="h-4 w-28 rounded animate-shimmer mb-4" />
      <div className="h-6 w-48 rounded animate-shimmer mb-6" />
      <div className="h-10 rounded-[var(--radius-md)] animate-shimmer mb-8" />
      <div className="h-24 rounded-[var(--radius-lg)] animate-shimmer mb-6" />
      <div className="h-24 rounded-[var(--radius-lg)] animate-shimmer mb-6" />
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchOrder = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get(`/admin/orders/${id}`, { token })
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  async function handleStatusUpdate() {
  if (!pendingStatus) return;
  if (!confirming) {
    setConfirming(true);
    return;
  }
  setConfirming(false);
  setUpdating(true);
  try {
    await apiClient.put(`/admin/orders/${id}/status`, { status: pendingStatus }, { token });
    showToast('Order status updated.', 'success');
    setOrder((prev) => ({ ...prev, status: pendingStatus }));
    setPendingStatus('');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setUpdating(false);
  }
}
  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="h-11 w-11 rounded-full bg-error-light flex items-center justify-center">
          <AlertTriangle size={20} className="text-error" />
        </div>
        <p className="text-sm font-medium text-gray-900">Couldn't load order</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!order) return <p className="text-sm text-gray-500">Order not found.</p>;

  return (
    <div className="max-w-lg">
      <Link
        to="/admin/orders"
        className="focus-ring inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors duration-150 mb-4"
      >
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">Order #{order.orderNumber}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvoice(true)}
            className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer size={13} /> Print Invoice
          </button>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 mb-6">
        <OrderProgress status={order.status} />
      </div>

      <Section label="Customer">
        <p className="text-sm text-gray-900">{order.customerName || '—'}</p>
        {order.customerEmail && <p className="text-sm text-gray-500">{order.customerEmail}</p>}
      </Section>

      <Section label="Items">
        <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs divide-y divide-gray-200 overflow-hidden">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between px-4 py-3 text-sm">
              <div>
                <p className="text-gray-900">{item.productNameSnapshot}</p>
                <p className="text-xs text-gray-500">
                  {item.sizeSnapshot}, {item.colorSnapshot} × {item.quantity}
                </p>
              </div>
              <span className="text-gray-900 font-medium">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Shipping Address">
        <p className="text-sm text-gray-900">{order.phone}</p>
        <p className="text-sm text-gray-900">{order.shippingAddress}</p>
      </Section>

      <Section label="Payment Method">
        <p className="text-sm text-gray-900 capitalize">{order.paymentMethod}</p>
      </Section>

      <div className="pt-4 border-t border-gray-200 mb-6 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>${Number(order.subtotalAmount ?? order.totalAmount).toFixed(2)}</span>
        </div>
        {Number(order.discountAmount) > 0 && (
          <div className="flex justify-between text-sm text-error">
            <span>Discount</span>
            <span>-${Number(order.discountAmount).toFixed(2)}</span>
          </div>
        )}
        {Number(order.taxAmount) > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax ({Number(order.taxRate)}%)</span>
            <span>${Number(order.taxAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-medium pt-1">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">${Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {NEXT_STATUSES[order.status]?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">Update status</p>
          <div className="flex items-center gap-3">
            <select
              value={pendingStatus}
              disabled={updating}
              onChange={(e) => setPendingStatus(e.target.value)}
              className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-gray-900 bg-surface disabled:opacity-40"
            >
              <option value="">Move to…</option>
              {NEXT_STATUSES[order.status].map((s) => (
                <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={!pendingStatus || updating}
              className="focus-ring press-scale px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-40"
            >
              {updating ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        </div>
      )}

      {showInvoice && (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #order-invoice, #order-invoice * { visibility: visible; }
              #order-invoice { position: fixed; inset: 0; margin: auto; }
            }
          `}</style>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:static">
            <div
              id="order-invoice"
              className="bg-white rounded-[var(--radius-md)] max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none"
            >
              <div className="text-center mb-4">
                <p className="text-sm font-semibold text-gray-900">Thida Shop</p>
                <p className="text-xs text-gray-500">Sale Invoice</p>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5 mb-4">
                <div className="flex justify-between"><span>Order #</span><span>{order.orderNumber}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{new Date(order.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Customer</span><span>{order.customerName || 'Walk-in'}</span></div>
                <div className="flex justify-between"><span>Phone</span><span>{order.phone}</span></div>
                <div className="flex justify-between"><span>Payment</span><span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span></div>
              </div>

              <ul className="border-t border-b border-gray-100 divide-y divide-gray-100 mb-3">
                {order.items.map((item, i) => (
                  <li key={i} className="py-1.5 flex justify-between text-xs">
                    <span className="flex-1 min-w-0 truncate pr-2">
                      {item.productNameSnapshot} ({item.sizeSnapshot}/{item.colorSnapshot}) × {item.quantity}
                    </span>
                    <span className="shrink-0">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="text-sm space-y-1 mb-5">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotalAmount ?? order.totalAmount).toFixed(2)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-error">
                    <span>Discount</span>
                    <span>-${Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {Number(order.taxAmount) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax ({Number(order.taxRate)}%)</span>
                    <span>${Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-1">
                  <span>Total</span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="flex-1 py-2 rounded-[var(--radius-md)] border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-[var(--radius-md)] bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
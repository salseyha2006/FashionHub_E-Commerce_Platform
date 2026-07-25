// src/pages/OrderDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, PackageX } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import StatusBadge from '../components/orders/StatusBadge';
import OrderProgress from '../components/orders/OrderProgress';
import { formatPrice } from '../utils/currency';

export default function OrderDetail() {
  const { id } = useParams();
  const { order, loading, error, errorStatus, refetch } = useOrder(id);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-lg mx-auto flex flex-col gap-4">
        <div className="h-6 w-1/2 rounded animate-shimmer" />
        <div className="h-10 rounded-[var(--radius-lg)] animate-shimmer" />
        <div className="h-32 rounded-[var(--radius-lg)] animate-shimmer" />
        <div className="h-20 rounded-[var(--radius-lg)] animate-shimmer" />
      </div>
    );
  }

  if (error || !order) {
    const notFound = errorStatus === 404;
    return (
      <div className="px-4 py-20 flex flex-col items-center text-center">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${notFound ? 'bg-gray-100' : 'bg-error-light'}`}>
          {notFound
            ? <PackageX size={26} className="text-gray-400" strokeWidth={1.5} />
            : <AlertTriangle size={26} className="text-error" strokeWidth={1.5} />}
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          {notFound ? "Order not found" : "Couldn't load this order"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {notFound ? "It may not exist or you don't have access to it." : error}
        </p>
        {notFound ? (
          <button
            onClick={() => navigate('/my-orders')}
            className="focus-ring press-scale px-6 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] shadow-xs hover:bg-gray-50 transition-colors duration-150"
          >
            Back to my orders
          </button>
        ) : (
          <button
            onClick={refetch}
            className="focus-ring press-scale flex items-center gap-2 px-6 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] shadow-xs hover:bg-gray-50 transition-colors duration-150"
          >
            <RefreshCw size={15} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-8">
        <OrderProgress status={order.status} />
      </div>

      <div className="mb-6">
        <p className="text-xs font-medium text-gray-600 mb-2">Items</p>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-3 text-sm">
              <div>
                <p className="text-gray-900">{item.productNameSnapshot}</p>
                <p className="text-xs text-gray-500">
                  {item.sizeSnapshot}, {item.colorSnapshot} × {item.quantity}
                </p>
              </div>
              <span className="text-gray-900">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-medium text-gray-600 mb-2">Shipping Address</p>
        <p className="text-sm text-gray-900">{order.phone}</p>
        <p className="text-sm text-gray-900">{order.shippingAddress}</p>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200 text-base font-medium">
        <span className="text-gray-900">Total</span>
        <span className="text-gray-900">{formatPrice(order.totalAmount)}</span>
      </div>
    </div>
  );
}
// src/pages/OrderDetail.jsx — REDESIGNED (plain labels, token cleanup)
import { useParams } from 'react-router-dom';
import { useOrder } from '../hooks/useOrder';
import StatusBadge from '../components/orders/StatusBadge';
import OrderProgress from '../components/orders/OrderProgress';

export default function OrderDetail() {
  const { id } = useParams();
  const { order, loading, error } = useOrder(id);

  if (loading) {
    return <div className="px-4 py-16 text-center text-sm text-gray-500">Loading order…</div>;
  }

  if (error || !order) {
    return <div className="px-4 py-16 text-center text-sm text-gray-500">Order not found.</div>;
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
              <span className="text-gray-900">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
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
        <span className="text-gray-900">${Number(order.totalAmount).toFixed(2)}</span>
      </div>
    </div>
  );
}
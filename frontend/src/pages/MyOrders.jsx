// src/pages/MyOrders.jsx — REDESIGNED (shimmer loading, icon-circle empty state matching Cart/Wishlist, card hover lift)
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import StatusBadge from '../components/orders/StatusBadge';

export default function MyOrders() {
  const { orders, loading } = useOrders();

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto flex flex-col gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[var(--radius-lg)] animate-shimmer" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="px-4 py-20 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Package size={26} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-gray-500 mb-1">You haven't placed any orders yet.</p>
        <Link to="/shop" className="focus-ring inline-block mt-3 text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-primary-600 transition-colors duration-150">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto pb-20 md:pb-8">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-4">My Orders</h1>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/my-orders/${order.id}`}
            className="focus-ring block bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 hover:shadow-md hover:border-primary-500 transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-900 font-medium">${Number(order.totalAmount).toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
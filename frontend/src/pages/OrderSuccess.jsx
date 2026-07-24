// src/pages/OrderSuccess.jsx — REDESIGNED (success-green icon instead of brand pink — a completed-order checkmark is a status signal, not a brand moment; pink primary + gray secondary buttons)
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) return <Navigate to="/" replace />;

  return (
    <div className="px-4 py-20 flex flex-col items-center text-center">
      <div className="h-16 w-16 rounded-full bg-success-light flex items-center justify-center mb-4">
        <CheckCircle2 size={30} className="text-success" strokeWidth={1.5} />
      </div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Order placed!</h1>
      <p className="text-sm text-gray-500 mb-8">Order #{order.orderNumber}</p>
      <div className="flex gap-3">
        <Link
          to="/my-orders"
          className="focus-ring press-scale px-6 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
        >
          View order
        </Link>
        <Link
          to="/"
          className="focus-ring press-scale px-6 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
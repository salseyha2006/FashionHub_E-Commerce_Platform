// src/pages/Cart.jsx — REDESIGNED (shimmer loading, solid pink primary CTA, surface-consistent fixed bar)
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItemRow from '../components/cart/CartItemRow';

export default function Cart() {
  const { items, subtotal, loading } = useCart();
  const navigate = useNavigate();

  if (loading && items.length === 0) {
    return (
      <div className="px-4 md:px-8 lg:px-12 py-6 max-w-2xl mx-auto">
        <div className="h-6 w-1/3 rounded animate-shimmer mb-6" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 py-4 border-b border-gray-200">
            <div className="w-20 h-24 rounded-[var(--radius-sm)] animate-shimmer" />
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <div className="h-3 w-3/4 rounded animate-shimmer" />
              <div className="h-3 w-1/2 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-20 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ShoppingBag size={26} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/shop"
          className="focus-ring press-scale px-6 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-6 max-w-2xl mx-auto pb-28 md:pb-8">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-4">
        My Cart ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
      </h1>

      <div>
        {items.map((item) => <CartItemRow key={item.id} item={item} />)}
      </div>

      <div className="flex items-center justify-between py-4 text-base">
        <span className="text-gray-900 font-medium">Subtotal</span>
        <span className="text-gray-900 font-semibold">${subtotal.toFixed(2)}</span>
      </div>

      {/* Mobile: fixed bottom button. Desktop: inline */}
      <div className="hidden md:block">
        <button
          onClick={() => navigate('/checkout')}
          className="focus-ring press-scale w-full py-3.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
        >
          Proceed to checkout
        </button>
      </div>
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-gray-200 px-4 py-3">
        <button
          onClick={() => navigate('/checkout')}
          className="focus-ring press-scale w-full py-3.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
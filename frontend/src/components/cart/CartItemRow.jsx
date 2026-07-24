// src/components/cart/CartItemRow.jsx — REDESIGNED (radius token on thumbnail, ghost hover on remove button)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import QuantityStepper from '../product/QuantityStepper';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function CartItemRow({ item }) {
  const { updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const { variant, quantity } = item;
  const { product } = variant;

  async function handleQuantityChange(next) {
    setBusy(true);
    try {
      await updateQuantity(item.id, next);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await removeItem(item.id);
    } catch (err) {
      showToast(err.message, 'error');
      setBusy(false);
    }
  }

  return (
    <div className={`flex gap-3 py-4 border-b border-gray-200 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
      <Link to={`/product/${product.id}`} className="shrink-0">
        <img
          src={product.image || 'https://placehold.co/96x128?text=No+Image'}
          alt={product.name}
          className="w-20 h-24 object-cover rounded-[var(--radius-sm)] bg-gray-100"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link to={`/product/${product.id}`} className="text-sm font-medium text-gray-900 line-clamp-1">
            {product.name}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">
            Size: {variant.size}, Color: {variant.color}
          </p>
          <p className="text-sm text-gray-900 mt-1">${Number(product.price).toFixed(2)}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <QuantityStepper quantity={quantity} max={variant.stockQuantity} onChange={handleQuantityChange} />
          <button
            onClick={handleRemove}
            className="focus-ring w-11 h-11 flex items-center justify-center rounded-[var(--radius-sm)] text-gray-500 hover:text-error hover:bg-error-light transition-colors duration-150"
            aria-label="Remove item"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
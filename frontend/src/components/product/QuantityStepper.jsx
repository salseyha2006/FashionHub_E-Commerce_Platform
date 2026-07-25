// src/components/product/QuantityStepper.jsx
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ quantity, max, onChange }) {
  return (
    <div className="flex items-center border-2 border-gray-300 rounded-full w-fit">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="focus-ring press-scale h-11 w-11 flex items-center justify-center rounded-full text-gray-900 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Decrease quantity"
      >
        <Minus size={15} />
      </button>
      <span className="w-8 text-center text-sm text-gray-900 font-medium">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="focus-ring press-scale h-11 w-11 flex items-center justify-center rounded-full text-gray-900 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Increase quantity"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
// src/components/product/QuantityStepper.jsx — REDESIGNED (pill shape)
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ quantity, max, onChange }) {
  return (
    <div className="flex items-center border-2 border-stone rounded-full w-fit">
      <button type="button" onClick={() => onChange(Math.max(1, quantity - 1))} disabled={quantity <= 1}
        className="h-11 w-11 flex items-center justify-center text-ink disabled:opacity-30" aria-label="Decrease quantity">
        <Minus size={15} />
      </button>
      <span className="w-8 text-center text-sm text-ink font-medium">{quantity}</span>
      <button type="button" onClick={() => onChange(Math.min(max, quantity + 1))} disabled={quantity >= max}
        className="h-11 w-11 flex items-center justify-center text-ink disabled:opacity-30" aria-label="Increase quantity">
        <Plus size={15} />
      </button>
    </div>
  );
}
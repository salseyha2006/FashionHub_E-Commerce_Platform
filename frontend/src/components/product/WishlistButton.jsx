// src/components/product/WishlistButton.jsx — REDESIGNED (focus ring + press feedback baked in regardless of call site)
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';

export default function WishlistButton({ productId, size = 22, className = '' }) {
  const { isWishlisted, toggle } = useWishlist();
  const active = isWishlisted(productId);

  return (
    <button
      onClick={(e) => { e.preventDefault(); toggle(productId); }}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      className={`focus-ring press-scale transition-colors duration-150 ${className}`}
    >
      <Heart size={size} className={active ? 'fill-primary-500 text-primary-500' : 'text-gray-700'} />
    </button>
  );
}
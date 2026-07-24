// src/pages/Wishlist.jsx — REDESIGNED (empty-state icon circle, solid pink CTA, matching Cart.jsx's empty-state pattern)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/skeletons/Skeletons';

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // No bulk "get by ids" endpoint exists yet, so we fetch each product
    // individually and drop any that failed (e.g. since-deleted product).
    Promise.allSettled(ids.map((id) => apiClient.get(`/products/${id}`)))
      .then((results) => {
        if (cancelled) return;
        setProducts(
          results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        );
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ids]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-4">Wishlist</h1>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="px-4 py-20 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Heart size={26} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Your wishlist is empty</h1>
        <p className="text-sm text-gray-500 mb-6">Tap the heart icon on any product to save it here.</p>
        <Link
          to="/shop"
          className="focus-ring press-scale px-6 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 pb-20 md:pb-8">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-4">
        Wishlist ({products.length})
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
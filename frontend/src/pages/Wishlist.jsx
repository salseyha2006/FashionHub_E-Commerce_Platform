// src/pages/Wishlist.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/skeletons/Skeletons';

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadProducts = useCallback(() => {
    if (ids.length === 0) {
      setProducts([]);
      setFailed(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    Promise.allSettled(ids.map((id) => apiClient.get(`/products/${id}`)))
      .then((results) => {
        if (cancelled) return;
        const fulfilled = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        setProducts(fulfilled);
        setFailed(fulfilled.length === 0 && results.length > 0);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ids]);

  useEffect(() => loadProducts(), [loadProducts]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 py-6 max-w-7xl mx-auto">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-4">Wishlist</h1>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="px-4 py-20 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-error-light flex items-center justify-center mb-4">
          <AlertTriangle size={26} className="text-error" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Couldn't load your wishlist</h1>
        <p className="text-sm text-gray-500 mb-6">Check your connection and try again.</p>
        <button
          onClick={loadProducts}
          className="focus-ring press-scale flex items-center gap-2 px-6 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] shadow-xs hover:bg-gray-50 transition-colors duration-150"
        >
          <RefreshCw size={15} /> Retry
        </button>
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
    <div className="px-4 md:px-8 lg:px-12 py-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-4">
        Wishlist ({products.length})
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
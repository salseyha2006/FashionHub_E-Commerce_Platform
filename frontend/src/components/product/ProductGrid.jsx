// src/components/product/ProductGrid.jsx — REDESIGNED (secondary-button style Load more, richer empty state, unchanged infinite-scroll logic)
import { useEffect, useRef } from 'react';
import { PackageSearch } from 'lucide-react';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from '../skeletons/Skeletons';

export default function ProductGrid({
  products, loading, loadingMore, hasMore, onLoadMore,
  columns = 'grid-cols-2 md:grid-cols-4',
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (loading) return <ProductGridSkeleton />;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
          <PackageSearch size={22} strokeWidth={1.75} className="text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">No products found</p>
          <p className="text-sm text-gray-500 mt-0.5">Try adjusting your filters or search terms.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={`grid ${columns} gap-4 md:gap-6`}>
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="focus-ring press-scale px-5 py-2.5 text-sm font-medium text-gray-700 bg-surface border border-gray-300 rounded-[var(--radius-md)] shadow-xs hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
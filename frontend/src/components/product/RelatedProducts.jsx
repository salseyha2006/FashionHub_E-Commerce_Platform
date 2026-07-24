// src/components/product/RelatedProducts.jsx — REDESIGNED (token cleanup only)
import ProductCard from './ProductCard';
import { useProducts } from '../../hooks/useProducts';

export default function RelatedProducts({ categorySlug, excludeId }) {
  const { products, loading } = useProducts({ category: categorySlug }, 8);
  const filtered = products.filter((p) => p.id !== excludeId);

  if (loading || filtered.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">You may also like</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {filtered.map((product) => (
          <div key={product.id} className="w-40 md:w-52 shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
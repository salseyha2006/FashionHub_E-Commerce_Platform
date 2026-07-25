import { Link } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { formatPrice } from '../../utils/currency';

export default function ProductCard({ product }) {
  const image = product.images?.[0];
  return (
    <Link
      to={`/product/${product.id}`}
      className="focus-ring group flex flex-col rounded-[var(--radius-lg)] bg-surface border border-gray-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
        )}

        {!product.inStock && (
          <span className="absolute top-2.5 left-2.5 bg-gray-900/90 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Sold out
          </span>
        )}

        <WishlistButton
          productId={product.id}
          size={16}
          className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm rounded-full p-1.5 shadow-xs hover:bg-surface"
        />
      </div>

      <div className="flex items-start justify-between gap-2 px-3 py-3">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-sm font-semibold text-primary-600 shrink-0">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
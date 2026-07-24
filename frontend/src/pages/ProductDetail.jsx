// src/pages/ProductDetail.jsx — REDESIGNED (solid pink CTA at radius-md not rounded-full, warning-color low-stock text, plain labels)
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ImageGallery from '../components/product/ImageGallery';
import { ColorSwatches, SizeSelector } from '../components/product/SizeColorSelectors';
import QuantityStepper from '../components/product/QuantityStepper';
import RelatedProducts from '../components/product/RelatedProducts';
import WishlistButton from '../components/product/WishlistButton';
import { ProductDetailSkeleton } from '../components/skeletons/Skeletons';

export default function ProductDetail() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (loading) return <ProductDetailSkeleton />;
  if (error || !product) return <p className="px-4 py-16 text-center text-sm text-gray-500">Product not found.</p>;

  const selectedVariant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  const canAddToCart = Boolean(selectedVariant) && selectedVariant.stockQuantity > 0;
  const maxQuantity = selectedVariant?.stockQuantity || 1;

  function handleColorSelect(color) {
    setSelectedColor(color);
    setSelectedSize(null);
    setQuantity(1);
  }

  function handleSizeSelect(size) {
    setSelectedSize(size);
    setQuantity(1);
  }

  async function handleAddToCart() {
    if (!canAddToCart) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    setAdding(true);
    try {
      await addToCart(selectedVariant, product, quantity);
      showToast('Added to cart.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="px-4 md:px-8 lg:px-12 py-4 md:py-8 md:grid md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="relative">
          <ImageGallery images={product.images} alt={product.name} />
          <WishlistButton productId={product.id} className="hidden md:flex absolute top-3 right-3 bg-surface/90 rounded-full p-2.5 border border-gray-200 shadow-xs hover:bg-gray-50" />
        </div>

        <div className="flex flex-col gap-5 mt-5 md:mt-0">
          <div>
            <h1 className="text-xl md:text-3xl font-semibold tracking-tight text-gray-900">{product.name}</h1>
            <p className="text-lg text-primary-600 font-semibold mt-1">${Number(product.price).toFixed(2)}</p>
          </div>

          <ColorSwatches variants={product.variants} selectedColor={selectedColor} onSelect={handleColorSelect} />
          <SizeSelector variants={product.variants} selectedColor={selectedColor} selectedSize={selectedSize} onSelect={handleSizeSelect} />

          {selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= 5 && (
            <p className="text-xs text-warning font-medium">Only {selectedVariant.stockQuantity} left in stock</p>
          )}

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Quantity</p>
            <QuantityStepper quantity={quantity} max={maxQuantity} onChange={setQuantity} />
          </div>

          {/* Desktop: inline add-to-cart, no fixed bottom bar */}
          <div className="hidden md:flex items-center gap-3 mt-2">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || adding}
              className="focus-ring press-scale flex-1 py-4 rounded-[var(--radius-md)] bg-primary-500 text-white text-sm font-medium shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding…' : canAddToCart ? 'Add to cart' : 'Select size & color'}
            </button>
            <WishlistButton productId={product.id} className="p-4 rounded-[var(--radius-md)] border border-gray-300 hover:bg-gray-50" />
          </div>

          {product.description && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Description</p>
              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 mt-10">
        <RelatedProducts categorySlug={product.category?.slug} excludeId={product.id} />
      </div>

      {/* Mobile: fixed bottom action bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <WishlistButton productId={product.id} className="p-3.5 rounded-[var(--radius-md)] border border-gray-300 shrink-0" />
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart || adding}
          className="focus-ring press-scale flex-1 py-4 rounded-[var(--radius-md)] bg-primary-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? 'Adding…' : canAddToCart ? 'Add to cart' : 'Select size & color'}
        </button>
      </div>
    </div>
  );
}
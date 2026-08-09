// src/pages/Home.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import HeroBanner from '../components/home/HeroBanner';
import CategoryChips from '../components/home/CategoryChips';
import ProductGrid from '../components/product/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { useSettings } from '../hooks/useSettings';

const DEFAULT_SECTIONS = [
  { id: 'hero', label: 'Hero banner', visible: true },
  { id: 'categories', label: 'Featured categories', visible: true },
  { id: 'featured', label: 'Featured products', visible: true },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { products, loading, loadingMore, hasMore, loadMore, error, refetch } = useProducts({ sort: 'newest' }, 8);
  const { settings } = useSettings();

  const sections = settings?.homepageSections?.length ? settings.homepageSections : DEFAULT_SECTIONS;

  function renderSection(section) {
    if (!section.visible) return null;

    switch (section.id) {
      case 'hero':
        return <HeroBanner key="hero" />;

      case 'categories':
        return <CategoryChips key="categories" />;

      case 'featured':
        return (
          <div key="featured">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Featured</h2>
              <Link to="/shop" className="focus-ring text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors duration-150">
                View all
              </Link>
            </div>
            <ProductGrid
              products={products}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
              error={error}
              onRetry={refetch}
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 md:py-8 max-w-7xl mx-auto flex flex-col gap-7 md:gap-12">
      <div className="w-full md:max-w-md">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmit={(value) => value.trim() && navigate(`/shop?search=${encodeURIComponent(value.trim())}`)}
        />
      </div>
      {sections.map(renderSection)}
    </div>
  );
}
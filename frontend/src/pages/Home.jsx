// src/pages/Home.jsx — Phase 11: sections now driven by Admin's Homepage layout settings
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import HeroBanner from '../components/home/HeroBanner';
import CategoryChips from '../components/home/CategoryChips';
import ProductGrid from '../components/product/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { useSettings } from '../hooks/useSettings';

// Used until settings load (and as a safety net if an Admin never saved
// homepage layout yet) — same order/visibility the page always had.
const DEFAULT_SECTIONS = [
  { id: 'hero', label: 'Hero banner', visible: true },
  { id: 'categories', label: 'Featured categories', visible: true },
  { id: 'featured', label: 'Featured products', visible: true },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { products, loading, loadingMore, hasMore, loadMore } = useProducts({ sort: 'newest' }, 8);
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
            <ProductGrid products={products} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 md:py-8 flex flex-col gap-7 md:gap-12">
      <SearchBar
        value={search}
        onChange={setSearch}
        onSubmit={(value) => value.trim() && navigate(`/shop?search=${encodeURIComponent(value.trim())}`)}
      />
      {sections.map(renderSection)}
    </div>
  );
}

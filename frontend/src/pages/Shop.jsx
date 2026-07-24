// src/pages/Shop.jsx — REDESIGNED (no local styling of its own beyond the components it composes; all changes are in the child components above)
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import FilterButton from '../components/filter/FilterButton';
import FilterSheet from '../components/filter/FilterSheet';
import FilterSidebar from '../components/filter/FilterSidebar';
import SortControl from '../components/product/SortControl';
import ProductGrid from '../components/product/ProductGrid';
import { useProducts } from '../hooks/useProducts';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '',
  }), [searchParams]);

  const { products, loading, loadingMore, hasMore, loadMore } = useProducts(filters, 12);

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  }

  const activeFilterCount = ['category', 'size', 'color', 'minPrice', 'maxPrice'].filter((k) => filters[k]).length;

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 md:py-8">
      <div className="mb-5">
        <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={(value) => updateParams({ search: value.trim() })} />
      </div>

      <div className="flex items-center gap-3 mb-6 md:hidden">
        <FilterButton activeCount={activeFilterCount} onClick={() => setFilterSheetOpen(true)} />
        <SortControl sort={filters.sort} onChange={(sort) => updateParams({ sort })} />
      </div>

      <FilterSheet open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} filters={filters} onApply={updateParams} />

      <div className="md:flex md:gap-8">
        <FilterSidebar filters={filters} onApply={updateParams} />

        <div className="flex-1">
          <div className="hidden md:flex justify-end mb-6">
            <SortControl sort={filters.sort} onChange={(sort) => updateParams({ sort })} />
          </div>
          <ProductGrid
            products={products} loading={loading} loadingMore={loadingMore}
            hasMore={hasMore} onLoadMore={loadMore}
            columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          />
        </div>
      </div>
    </div>
  );
}
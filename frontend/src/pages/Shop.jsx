// src/pages/Shop.jsx
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import FilterButton from '../components/filter/FilterButton';
import FilterSheet from '../components/filter/FilterSheet';
import FilterSidebar from '../components/filter/FilterSidebar';
import SortControl from '../components/product/SortControl';
import ProductGrid from '../components/product/ProductGrid';
import { useProducts } from '../hooks/useProducts';

const EMPTY_FILTERS = { category: '', size: '', color: '', minPrice: '', maxPrice: '' };

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

  const { products, loading, loadingMore, hasMore, loadMore, error, refetch, pagination } = useProducts(filters, 12);

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  }

  function clearFilters() {
    updateParams(EMPTY_FILTERS);
  }

  const activeFilterCount = ['category', 'size', 'color', 'minPrice', 'maxPrice'].filter((k) => filters[k]).length;

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 md:py-8 max-w-7xl mx-auto">
      <div className="mb-5 md:max-w-md">
        <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={(value) => updateParams({ search: value.trim() })} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-6 md:hidden">
        <FilterButton activeCount={activeFilterCount} onClick={() => setFilterSheetOpen(true)} />
        <SortControl sort={filters.sort} onChange={(sort) => updateParams({ sort })} />
      </div>

      <FilterSheet open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} filters={filters} onApply={updateParams} />

      <div className="md:flex md:gap-8">
        <FilterSidebar filters={filters} onApply={updateParams} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="hidden md:block text-sm text-gray-500">
              {!loading && !error && (pagination ? `${pagination.total} ${pagination.total === 1 ? 'result' : 'results'}` : '')}
            </p>
            <div className="hidden md:flex">
              <SortControl sort={filters.sort} onChange={(sort) => updateParams({ sort })} />
            </div>
          </div>
          <ProductGrid
            products={products} loading={loading} loadingMore={loadingMore}
            hasMore={hasMore} onLoadMore={loadMore}
            error={error} onRetry={refetch}
            onClearFilters={activeFilterCount > 0 || filters.search ? clearFilters : undefined}
            columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          />
        </div>
      </div>
    </div>
  );
}
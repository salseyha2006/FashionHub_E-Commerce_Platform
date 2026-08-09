// src/components/filter/FilterSidebar.jsx — REDESIGNED (plain heading, not uppercase)
import FilterPanelContent from './FilterPanelContent';
import { useCategories } from '../../hooks/useCategories';

export default function FilterSidebar({ filters, onApply }) {
  const { categories } = useCategories();
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <aside className="hidden md:block w-56 shrink-0 pr-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Filter</h2>
        {activeCount > 0 && (
          <button
            onClick={() => onApply({ category: '', size: '', color: '', minPrice: '', maxPrice: '' })}
            className="focus-ring text-xs text-gray-500 hover:text-primary-600 underline underline-offset-2 transition-colors duration-150"
          >
            Clear all
          </button>
        )}
      </div>
      <FilterPanelContent categories={categories} draft={filters} onChange={(patch) => onApply({ ...filters, ...patch })} />
    </aside>
  );
}
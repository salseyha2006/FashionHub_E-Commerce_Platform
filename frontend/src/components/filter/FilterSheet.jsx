// src/components/filter/FilterSheet.jsx — REDESIGNED (secondary Clear + primary pink Apply)
import { useState, useEffect } from 'react';
import BottomSheet from '../ui/BottomSheet';
import FilterPanelContent from './FilterPanelContent';
import { useCategories } from '../../hooks/useCategories';

const EMPTY = { category: '', size: '', color: '', minPrice: '', maxPrice: '' };

export default function FilterSheet({ open, onClose, filters, onApply }) {
  const { categories } = useCategories();
  const [draft, setDraft] = useState({ ...EMPTY, ...filters });

  useEffect(() => { if (open) setDraft({ ...EMPTY, ...filters }); }, [open, filters]);

  function handleApply() { onApply(draft); onClose(); }
  function handleClear() { setDraft(EMPTY); onApply(EMPTY); onClose(); }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filter"
      footer={
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="focus-ring press-scale flex-1 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="focus-ring press-scale flex-1 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
          >
            Apply
          </button>
        </div>
      }
    >
      <FilterPanelContent categories={categories} draft={draft} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
    </BottomSheet>
  );
}
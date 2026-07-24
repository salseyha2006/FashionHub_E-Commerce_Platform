// src/components/filter/FilterButton.jsx — REDESIGNED
import { SlidersHorizontal } from 'lucide-react';

export default function FilterButton({ activeCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="focus-ring press-scale md:hidden flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-[var(--radius-md)] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
    >
      <SlidersHorizontal size={15} />
      Filter
      {activeCount > 0 && (
        <span className="h-4 w-4 rounded-full bg-primary-500 text-white text-[10px] leading-4 text-center">{activeCount}</span>
      )}
    </button>
  );
}
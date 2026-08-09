// src/components/product/SortControl.jsx — REDESIGNED (surface dropdown, gray hover not pink-tint hover, pink reserved for the selected row)
import { useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';

const OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SortControl({ sort, onChange }) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === sort) || OPTIONS[0];

  function select(value) { onChange(value); setOpen(false); }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="focus-ring press-scale flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-[var(--radius-md)] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
      >
        <ArrowUpDown size={15} />
        <span className="hidden sm:inline">Sort:</span> {current.label}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Sort by">
        <div className="flex flex-col">
          {OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => select(opt.value)} className="flex items-center justify-between py-3.5 border-b border-gray-200 text-sm text-gray-900 last:border-b-0">
              {opt.label}
              {opt.value === sort && <Check size={16} className="text-primary-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {open && (
        <>
          <div className="hidden md:block fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="hidden md:block absolute right-0 top-full mt-2 w-56 bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-lg z-50 py-1">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => select(opt.value)}
                className={`focus-ring w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 ${
                  opt.value === sort ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                {opt.label}
                {opt.value === sort && <Check size={16} className="text-primary-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
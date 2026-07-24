// src/components/common/SearchBar.jsx — REDESIGNED (focus-glow ring instead of solid border on focus)
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search products' }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }} className="relative">
      <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring w-full pl-11 pr-4 py-3 border border-gray-300 rounded-full text-sm text-gray-900 placeholder:text-gray-400 bg-surface focus:border-primary-500 transition-colors duration-150"
      />
    </form>
  );
}
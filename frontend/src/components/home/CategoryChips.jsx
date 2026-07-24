// src/components/home/CategoryChips.jsx — REDESIGNED (soft pink fill on hover, not solid black; shimmer loading)
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';

export default function CategoryChips() {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-20 rounded-full animate-shimmer shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/shop?category=${cat.slug}`}
          className="focus-ring shrink-0 px-5 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-150 whitespace-nowrap"
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
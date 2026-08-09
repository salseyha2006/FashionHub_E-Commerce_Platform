// src/components/skeletons/Skeletons.jsx — REDESIGNED (shimmer animation from the design system, card shape matches new ProductCard layout)

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-gray-200 overflow-hidden">
      <div className="aspect-[3/4] animate-shimmer" />
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="h-3.5 w-2/3 rounded animate-shimmer" />
        <div className="h-3.5 w-10 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 md:py-8 md:grid md:grid-cols-2 md:gap-12 lg:gap-16">
      <div className="aspect-[3/4] rounded-[var(--radius-lg)] animate-shimmer" />
      <div className="flex flex-col gap-4 mt-5 md:mt-0">
        <div className="h-6 w-2/3 rounded animate-shimmer" />
        <div className="h-4 w-1/4 rounded animate-shimmer" />
        <div className="h-10 w-1/2 rounded-[var(--radius-md)] animate-shimmer" />
        <div className="h-10 w-2/3 rounded-[var(--radius-md)] animate-shimmer" />
        <div className="h-11 w-full rounded-[var(--radius-md)] animate-shimmer mt-2" />
      </div>
    </div>
  );
}
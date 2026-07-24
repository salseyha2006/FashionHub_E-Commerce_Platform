// src/components/home/HeroBanner.jsx — REDESIGNED + BUG FIX (invalid object-key syntax from the earlier rename pass fixed; diagonal clip-path replaced with a clean rounded card, matching the flat-SaaS direction)
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useBanners } from '../../hooks/useBanners';

const GRADIENT_MAP = {
  'primary-500': 'from-primary-500 to-primary-600',
  'gray-900': 'from-gray-900 to-gray-500',
  'gray-500': 'from-gray-500 to-gray-900',
};

export default function HeroBanner() {
  const { banners, loading } = useBanners();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) setIndex((i) => Math.max(0, i - 1));
    else if (delta < -50) setIndex((i) => Math.min(banners.length - 1, i + 1));
    touchStartX.current = null;
  }

  if (loading) {
    return <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-[var(--radius-xl)] animate-shimmer" />;
  }

  if (banners.length === 0) return null;

  const slide = banners[index];
  const gradientClass = GRADIENT_MAP[slide.gradientFrom] || GRADIENT_MAP['primary-500'];

  return (
    <div>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={
          slide.imageUrl
            ? { backgroundImage: `url(${slide.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
        className={`w-full aspect-[16/9] md:aspect-[21/9] flex flex-col justify-end p-6 md:p-10 rounded-[var(--radius-xl)] overflow-hidden relative shadow-sm ${
          slide.imageUrl ? '' : `bg-gradient-to-br ${gradientClass}`
        }`}
      >
        
        <Link to={slide.ctaLink} className="focus-ring max-w-xs relative rounded-[var(--radius-sm)]">
          <h2 className="text-white text-2xl md:text-4xl font-semibold tracking-tight">{slide.title}</h2>
          {slide.subtitle && <p className="text-white/85 text-sm md:text-base mt-1.5">{slide.subtitle}</p>}
          <span className="focus-ring press-scale inline-block mt-4 text-white text-sm font-medium bg-white/15 backdrop-blur-sm px-4 py-2 rounded-[var(--radius-md)] hover:bg-white/25 transition-colors duration-150">
            {slide.ctaText}
          </span>
        </Link>
      </div>

      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`focus-ring h-1.5 rounded-full transition-all duration-200 ${i === index ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
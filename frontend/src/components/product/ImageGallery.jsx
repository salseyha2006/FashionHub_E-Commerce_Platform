// src/components/product/ImageGallery.jsx — REDESIGNED (radius tokens, focus-ring on zoom close)
import { useState, useRef } from 'react';
import { X } from 'lucide-react';

export default function ImageGallery({ images = [], alt }) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef(null);

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) setIndex((i) => Math.max(0, i - 1));
    else if (delta < -50) setIndex((i) => Math.min(images.length - 1, i + 1));
    touchStartX.current = null;
  }

  if (images.length === 0) {
    return <div className="aspect-[3/4] bg-gray-100 rounded-[var(--radius-lg)] flex items-center justify-center text-gray-400 text-sm">No image</div>;
  }

  return (
    <div>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setZoomOpen(true)}
        className="relative aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden bg-gray-100 cursor-zoom-in"
      >
        <img src={images[index]} alt={alt} className="w-full h-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              aria-label={`View image ${i + 1}`}
              className={`focus-ring h-1.5 rounded-full transition-all duration-200 ${i === index ? 'w-5 bg-primary-500' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>
      )}

      {zoomOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center" onClick={() => setZoomOpen(false)}>
          <button onClick={() => setZoomOpen(false)} className="focus-ring absolute top-4 right-4 p-2 text-white" aria-label="Close">
            <X size={26} />
          </button>
          <img
            src={images[index]} alt={alt} className="max-w-full max-h-full object-contain"
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
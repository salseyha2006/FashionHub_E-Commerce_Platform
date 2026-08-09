// src/components/product/SizeColorSelectors.jsx — REDESIGNED + BUG FIX ('rose' color-name key was corrupted to 'primary-500' by the earlier rename; reverted since it's product color data, not a design token). Selected size now pink, not solid black.
export function ColorSwatches({ variants, selectedColor, onSelect }) {
  const colors = [...new Set(variants.map((v) => v.color))];

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">Color{selectedColor ? `: ${selectedColor}` : ''}</p>
      <div className="flex gap-3">
        {colors.map((color) => (
          <button
            key={color} type="button" onClick={() => onSelect(color)} title={color}
            className={`focus-ring press-scale h-10 w-10 rounded-full border-2 transition-all duration-150 ${
              selectedColor === color ? 'border-primary-500 scale-110 ring-2 ring-primary-500/30' : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ backgroundColor: colorToHex(color) }}
          />
        ))}
      </div>
    </div>
  );
}

export function SizeSelector({ variants, selectedColor, selectedSize, onSelect }) {
  const sizesForColor = variants.filter((v) => !selectedColor || v.color === selectedColor);
  const allSizes = [...new Set(variants.map((v) => v.size))];

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">Size</p>
      <div className="flex gap-2.5 flex-wrap">
        {allSizes.map((size) => {
          const variant = sizesForColor.find((v) => v.size === size);
          const disabled = !variant || variant.stockQuantity === 0;
          return (
            <button
              key={size} type="button" disabled={disabled} onClick={() => onSelect(size)}
              className={`focus-ring press-scale h-12 w-12 rounded-full text-sm font-medium border-2 transition-colors duration-150 ${
                disabled ? 'border-gray-200 text-gray-400 cursor-not-allowed line-through'
                : selectedSize === size ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-gray-200 text-gray-900 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function colorToHex(name) {
  const map = {
    black: '#1C1917', white: '#FFFFFF', red: '#B23A3A', blue: '#3A5DA8',
    beige: '#D9C9B4', rose: '#B98B8B', green: '#4A6B4A', grey: '#9A948E', gray: '#9A948E',
  };
  return map[name?.toLowerCase()] || name;
}
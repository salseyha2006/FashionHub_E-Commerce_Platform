// src/components/filter/FilterPanelContent.jsx — REDESIGNED (plain labels, pink selected states, rounded inputs)
const SIZES = ['S', 'M', 'L', 'XL'];
const COLORS = [
  { name: 'Black', hex: '#1C1917' }, { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#B23A3A' }, { name: 'Blue', hex: '#3A5DA8' },
  { name: 'Beige', hex: '#D9C9B4' }, { name: 'Rose', hex: '#B98B8B' },
];

// NOTE: GET /api/products only accepts a single value each for
// category/size/color (?category=slug&size=M&color=Red) — no arrays. So
// these are tap-to-select single-choice controls: picking a second option
// replaces the first, not a true multi-select. Flag if the API should be
// extended to accept comma-separated values for real multi-select.
export default function FilterPanelContent({ categories, draft, onChange }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-medium text-gray-600 mb-3">Category</h3>
        <div className="flex flex-col gap-2.5">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.category === cat.slug}
                onChange={() => onChange({ category: draft.category === cat.slug ? '' : cat.slug })}
                className="h-4 w-4 accent-primary-500"
              />
              <span className="text-sm text-gray-900">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-600 mb-3">Size</h3>
        <div className="flex gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ size: draft.size === size ? '' : size })}
              className={`focus-ring press-scale h-10 w-10 rounded-[var(--radius-sm)] text-sm font-medium border transition-colors duration-150 ${
                draft.size === size ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-600 mb-3">Color</h3>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => onChange({ color: draft.color === color.name ? '' : color.name })}
              aria-label={color.name}
              title={color.name}
              className={`focus-ring press-scale h-8 w-8 rounded-full border-2 transition-all duration-150 ${
                draft.color === color.name ? 'border-primary-500 scale-110 ring-2 ring-primary-500/30' : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-600 mb-3">Price</h3>
        <div className="flex items-center gap-3">
          <input
            type="number" min="0" placeholder="Min"
            value={draft.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number" min="0" placeholder="Max"
            value={draft.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
          />
        </div>
      </div>
    </div>
  );
}
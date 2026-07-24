// src/pages/admin/AdminProductForm.jsx — MERGED: inline category creation + row-based images (kept as-is)
// + Quick Generate variant bulk-creator + per-row color chips (re-added on top)
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, Plus, X, Wand2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCategories } from '../../hooks/useCategories';

const emptyVariant = () => ({ size: '', color: '', stockQuantity: 0, sku: '' });
const inputClass = 'focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150';
const FALLBACK_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FALLBACK_COLOR_PRESETS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#9CA3AF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#D6C7A1' },
];
const NEW_CATEGORY_VALUE = '__new__';

// Shared key builder so the save-time duplicate check and the Quick Generate
// panel's skip-duplicates logic can never drift out of sync with each other.
function variantKey(v) {
  return `${v.size.trim().toLowerCase()}__${v.color.trim().toLowerCase()}`;
}

function hasDuplicateVariant(variants) {
  const seen = new Set();
  for (const v of variants) {
    const key = variantKey(v);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

// Best-effort check for whether a typed color name resolves to a real CSS
// color keyword, purely for the little preview swatch — not validation.
function isValidColorName(str) {
  if (typeof document === 'undefined' || !str) return false;
  const el = document.createElement('div');
  el.style.color = '';
  el.style.color = str;
  return el.style.color !== '';
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const { showToast } = useToast();
  const { categories, refetch: refetchCategories } = useCategories();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState(['']);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategorySaving, setCreatingCategorySaving] = useState(false);

  // --- Quick generate panel state ---
  const [sizeOptions, setSizeOptions] = useState(FALLBACK_SIZE_PRESETS);
  const [colorPresets, setColorPresets] = useState(FALLBACK_COLOR_PRESETS);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [quickColors, setQuickColors] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [quickStock, setQuickStock] = useState(0);

  // Phase 11 — presets are now Admin-managed (Settings → Product presets)
  // instead of hard-coded here. Fall back silently to the built-in list
  // above if the settings fetch fails, so this form still works.
  useEffect(() => {
    apiClient.get('/admin/settings', { token })
      .then((s) => {
        if (Array.isArray(s.sizePresets) && s.sizePresets.length) setSizeOptions(s.sizePresets);
        if (Array.isArray(s.colorPresets) && s.colorPresets.length) setColorPresets(s.colorPresets);
      })
      .catch(() => { /* keep fallback presets */ });
  }, [token]);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get(`/products/${id}`)
      .then((product) => {
        setName(product.name);
        setCategoryId(product.category?.id || '');
        setDescription(product.description || '');
        setPrice(String(product.price));
        setIsActive(product.isActive ?? true);
        setImages(product.images?.length ? product.images : ['']);
        setVariants(product.variants.length ? product.variants : [emptyVariant()]);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isEdit, showToast]);

  function updateVariant(index, field, value) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }
  function addVariant() { setVariants((prev) => [...prev, emptyVariant()]); }
  function removeVariant(index) { setVariants((prev) => prev.filter((_, i) => i !== index)); }

  function updateImage(index, value) {
    setImages((prev) => prev.map((url, i) => (i === index ? value : url)));
  }
  function addImageRow() { setImages((prev) => [...prev, '']); }
  function removeImageRow(index) {
    setImages((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  function handleCategorySelect(value) {
    if (value === NEW_CATEGORY_VALUE) {
      setCreatingCategory(true);
      setNewCategoryName('');
    } else {
      setCategoryId(value);
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategorySaving(true);
    try {
      const created = await apiClient.post('/categories', { name: newCategoryName.trim() }, { token });
      await refetchCategories();
      setCategoryId(created.id);
      setCreatingCategory(false);
      setNewCategoryName('');
      showToast('Category created.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreatingCategorySaving(false);
    }
  }

  const imageUrls = images.map((s) => s.trim()).filter(Boolean);

  // --- Quick generate handlers ---
  function toggleSize(size) {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }
  function addCustomSize() {
    const val = customSizeInput.trim();
    if (!val) return;
    setSizeOptions((prev) => (prev.some((s) => s.toLowerCase() === val.toLowerCase()) ? prev : [...prev, val]));
    setSelectedSizes((prev) => (prev.includes(val) ? prev : [...prev, val]));
    setCustomSizeInput('');
  }
  function addColorFromInput() {
    const val = colorInput.trim().replace(/,$/, '');
    if (!val) return;
    setQuickColors((prev) => (prev.some((c) => c.toLowerCase() === val.toLowerCase()) ? prev : [...prev, val]));
    setColorInput('');
  }
  function handleColorKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addColorFromInput(); }
  }
  function removeQuickColor(color) { setQuickColors((prev) => prev.filter((c) => c !== color)); }
  function toggleColorPreset(colorName) {
    setQuickColors((prev) =>
      prev.some((c) => c.toLowerCase() === colorName.toLowerCase())
        ? prev.filter((c) => c.toLowerCase() !== colorName.toLowerCase())
        : [...prev, colorName]
    );
  }

  const generateCount = selectedSizes.length * quickColors.length;

  function handleGenerateVariants() {
    if (selectedSizes.length === 0 || quickColors.length === 0) {
      showToast('Select at least one size and one color to generate.', 'error');
      return;
    }
    // Drop the untouched initial placeholder row (empty size + color) so it
    // doesn't sit alongside real generated rows and trip the "required" check.
    const existingReal = variants.filter((v) => v.size.trim() || v.color.trim());
    const existingKeys = new Set(existingReal.map(variantKey));

    const generated = [];
    let skipped = 0;
    for (const size of selectedSizes) {
      for (const color of quickColors) {
        const key = variantKey({ size, color });
        if (existingKeys.has(key)) { skipped++; continue; }
        existingKeys.add(key);
        generated.push({ size, color, stockQuantity: Number(quickStock) || 0, sku: '' });
      }
    }
    if (generated.length === 0) {
      showToast('All of those combinations already exist in the list below.', 'error');
      return;
    }
    setVariants([...existingReal, ...generated]);
    showToast(
      `Added ${generated.length} variant${generated.length === 1 ? '' : 's'}${skipped ? ` — ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}.`,
      'success'
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (variants.length === 0) {
      showToast('At least one variant is required.', 'error');
      return;
    }
    if (hasDuplicateVariant(variants)) {
      showToast('Duplicate size + color combination found — each variant must be unique.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        categoryId,
        description: description || null,
        price: Number(price),
        images: imageUrls,
        isActive,
        variants: variants.map((v) => ({ size: v.size, color: v.color, stockQuantity: Number(v.stockQuantity), sku: v.sku })),
      };

      if (isEdit) {
        await apiClient.put(`/products/${id}`, payload, { token });
        showToast('Product updated.', 'success');
      } else {
        await apiClient.post('/products', payload, { token });
        showToast('Product created.', 'success');
      }
      navigate('/admin/products');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-6">
        {isEdit ? 'Edit product' : 'New product'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </Field>

        <Field label="Category">
          {creatingCategory ? (
            <div className="flex items-center gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                autoFocus
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategorySaving || !newCategoryName.trim()}
                className="focus-ring press-scale shrink-0 px-3 py-2.5 bg-gray-900 text-white text-xs font-medium rounded-[var(--radius-sm)] disabled:opacity-40"
              >
                {creatingCategorySaving ? '…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setCreatingCategory(false)}
                className="focus-ring press-scale shrink-0 p-2.5 text-gray-500 hover:bg-gray-100 rounded-[var(--radius-sm)] transition-colors duration-150"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <select value={categoryId} onChange={(e) => handleCategorySelect(e.target.value)} required className={inputClass}>
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value={NEW_CATEGORY_VALUE}>+ Add new category…</option>
            </select>
          )}
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />
        </Field>

        <Field label="Price (USD)">
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className={inputClass} />
        </Field>

        {isEdit && (
          <Field label="Status">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                {isActive ? 'Active — visible in shop' : 'Inactive — hidden from shop, order history kept'}
              </span>
            </label>
          </Field>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Images</p>
            <button
              type="button"
              onClick={addImageRow}
              className="focus-ring press-scale flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-150"
            >
              <Plus size={14} /> Add image
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <img
                  src={url || undefined}
                  alt={`Preview ${i + 1}`}
                  className={`w-11 h-11 shrink-0 object-cover rounded-[var(--radius-sm)] border border-gray-200 bg-gray-100 ${!url ? 'opacity-0' : ''}`}
                  onError={(e) => { e.target.style.opacity = 0.15; }}
                />
                <input
                  value={url}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeImageRow(i)}
                  disabled={images.length === 1 && !images[0]}
                  className="focus-ring press-scale shrink-0 p-2.5 text-gray-500 hover:text-error hover:bg-error-light rounded-[var(--radius-sm)] transition-colors duration-150 disabled:opacity-30"
                  aria-label="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick generate — bulk-create size × color variant rows */}
        <div className="border-2 border-dashed border-gray-300 rounded-[var(--radius-md)] p-3 flex flex-col gap-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Wand2 size={15} className="text-primary-500" />
            <p className="text-xs font-medium text-gray-700">Quick generate variants</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Sizes</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {sizeOptions.map((s) => (
                <button
                  key={s} type="button" onClick={() => toggleSize(s)}
                  className={`focus-ring press-scale px-2.5 py-1 text-xs rounded-full border transition-colors duration-150 ${
                    selectedSizes.includes(s) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                placeholder="Add custom size (e.g. 3XL)"
                className={`${inputClass} text-xs py-2`}
              />
              <button type="button" onClick={addCustomSize} className="focus-ring press-scale px-3 py-2 border border-gray-300 rounded-[var(--radius-sm)] text-xs text-gray-700 shrink-0">
                Add
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Preset colors — click to add</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {colorPresets.map((preset) => {
                const active = quickColors.some((c) => c.toLowerCase() === preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => toggleColorPreset(preset.name)}
                    className={`focus-ring press-scale flex items-center gap-1.5 pl-1 pr-2.5 py-1 text-xs rounded-full border transition-colors duration-150 ${
                      active ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-gray-200/60 shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mb-2">Colors — type and press Enter or comma to add</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickColors.map((c) => (
                <span key={c} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border border-gray-300 text-xs text-gray-700 bg-surface">
                  <span className="h-3.5 w-3.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: isValidColorName(c) ? c : '#E5E7EB' }} />
                  {c}
                  <button type="button" onClick={() => removeQuickColor(c)} className="text-gray-400 hover:text-error">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={handleColorKeyDown}
              onBlur={addColorFromInput}
              placeholder="e.g. Coral, Olive… (or anything not in the presets above)"
              className={`${inputClass} text-xs py-2`}
            />
          </div>

          <div className="flex items-end gap-3">
            <Field label="Default stock (per row)">
              <input
                type="number" min="0" value={quickStock}
                onChange={(e) => setQuickStock(e.target.value)}
                className={`${inputClass} w-28`}
              />
            </Field>
            <button
              type="button" onClick={handleGenerateVariants} disabled={generateCount === 0}
              className="focus-ring press-scale flex-1 py-2.5 rounded-[var(--radius-sm)] bg-gray-900 text-white text-xs font-medium hover:bg-primary-500 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate {generateCount > 0 ? generateCount : ''} variant{generateCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Variants (size / color / stock)</p>
            <button type="button" onClick={addVariant} className="focus-ring press-scale flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-150">
              <Plus size={14} /> Add variant
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {variants.map((v, i) => (
              <div key={i} className="border border-gray-200 rounded-[var(--radius-md)] p-3">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Field label="Size">
                    <input placeholder="M" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} required className={inputClass} />
                  </Field>
                  <Field label="Color">
                    <input placeholder="Black" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} required className={inputClass} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {sizeOptions.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => updateVariant(i, 'size', s)}
                        className={`focus-ring press-scale px-2.5 py-1 text-xs rounded-full border transition-colors duration-150 ${
                          v.size === s ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {quickColors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {quickColors.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => updateVariant(i, 'color', c)}
                          className={`focus-ring press-scale flex items-center gap-1 pl-1 pr-2 py-1 text-xs rounded-full border transition-colors duration-150 ${
                            v.color === c ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <span className="h-3 w-3 rounded-full border border-gray-200/60 shrink-0" style={{ backgroundColor: isValidColorName(c) ? c : '#E5E7EB' }} />
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <Field label="Stock">
                    <input type="number" min="0" placeholder="0" value={v.stockQuantity} onChange={(e) => updateVariant(i, 'stockQuantity', e.target.value)} required className={inputClass} />
                  </Field>
                  <Field label="SKU / barcode (optional)">
                    <input
                      placeholder="Auto-generated"
                      value={v.sku || ''}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length === 1}
                    className="focus-ring press-scale p-2.5 border border-gray-300 text-gray-500 hover:text-error hover:border-error rounded-[var(--radius-sm)] disabled:opacity-30 transition-colors duration-150 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="focus-ring press-scale mt-2 py-3.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-40"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </form>
    </div>
  );
}
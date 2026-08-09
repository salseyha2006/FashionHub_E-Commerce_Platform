// src/pages/admin/AdminProducts.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, FileSpreadsheet, PackageSearch, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCategories } from '../../hooks/useCategories';
import BulkImportModal from '../../components/admin/BulkImportModal';
import { formatPrice } from '../../utils/currency';

const LOW_STOCK_THRESHOLD = 5;
const PAGE_SIZE = 10;

export default function AdminProducts() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { categories } = useCategories();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (categorySlug) params.set('category', categorySlug);
      const data = await apiClient.get(`/products?${params.toString()}`);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(true);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, [page, categorySlug]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadProducts();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/products/${id}`, { token });
      showToast('Product deleted.', 'success');
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const rangeStart = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, pagination.total || products.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">Products</h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImportOpen(true)}
            className="focus-ring press-scale flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
          >
            <FileSpreadsheet size={16} /> Import from Excel
          </button>
          <Link
            to="/admin/products/new"
            className="focus-ring press-scale flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
          >
            <Plus size={16} /> New product
          </Link>
        </div>
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        categories={categories}
        onImported={() => { setPage(1); loadProducts(); }}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] pl-9 pr-3 py-2 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150"
          />
        </form>
        <select
          value={categorySlug}
          onChange={(e) => { setCategorySlug(e.target.value); setPage(1); }}
          className="focus-ring border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-gray-900 bg-surface"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {!loading && !error && pagination.total > 0 && (
        <p className="text-xs text-gray-500 mb-2">
          Showing {rangeStart}–{rangeEnd} of {pagination.total}
        </p>
      )}

      {loading ? (
        <>
          {/* Desktop skeleton */}
          <div className="hidden md:block rounded-[var(--radius-lg)] overflow-hidden border border-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-shimmer border-b border-gray-200 last:border-b-0" />
            ))}
          </div>
          {/* Mobile skeleton — matches card layout so it doesn't jump on load */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-shimmer rounded-[var(--radius-lg)] border border-gray-200" />
            ))}
          </div>
        </>
      ) : error ? (
        <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs px-4 py-14 flex flex-col items-center text-center">
          <p className="text-sm text-gray-500 mb-4">Couldn't load products.</p>
          <button
            onClick={loadProducts}
            className="focus-ring press-scale flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-surface border border-dashed border-gray-300 rounded-[var(--radius-lg)] px-4 py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4">
            <PackageSearch size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No products found</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm">
            {search || categorySlug ? 'Try adjusting your search or filters.' : 'Get started by adding your first product.'}
          </p>
          <Link
            to="/admin/products/new"
            className="focus-ring press-scale flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
          >
            <Plus size={16} /> Add product
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop/tablet: full table (md and up) */}
          <div className="hidden md:block bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOut = p.totalStock === 0;
                  const isLow = !isOut && p.totalStock <= LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={p.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://placehold.co/48x64?text=No+Image'}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded-[var(--radius-sm)] bg-gray-100 shrink-0"
                          />
                          <Link to={`/admin/products/${p.id}/edit`} className="text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium tabular-nums">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          isOut ? 'bg-error-light text-error border-error/20' :
                          isLow ? 'bg-warning-light text-warning border-warning/20' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {isOut ? 'Out of stock' : `${p.totalStock} in stock`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-error hover:bg-error-light transition-colors duration-150 disabled:opacity-40"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards, 44px touch targets */}
          <div className="md:hidden space-y-3">
            {products.map((p) => {
              const isOut = p.totalStock === 0;
              const isLow = !isOut && p.totalStock <= LOW_STOCK_THRESHOLD;
              return (
                <div key={p.id} className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 flex gap-3">
                  <img
                    src={p.images?.[0] || 'https://placehold.co/64x80?text=No+Image'}
                    alt={p.name}
                    className="w-14 h-[72px] object-cover rounded-[var(--radius-sm)] bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 block">
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-500 mb-1.5">{p.category?.name || '—'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{formatPrice(p.price)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        isOut ? 'bg-error-light text-error border-error/20' :
                        isLow ? 'bg-warning-light text-warning border-warning/20' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {isOut ? 'Out of stock' : `${p.totalStock} left`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0 -mr-1 -my-1">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="focus-ring w-11 h-11 flex items-center justify-center rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
                      aria-label="Edit"
                    >
                      <Pencil size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="focus-ring w-11 h-11 flex items-center justify-center rounded-[var(--radius-sm)] text-gray-500 hover:text-error hover:bg-error-light transition-colors duration-150 disabled:opacity-40"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="focus-ring px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-150"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="focus-ring px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-150"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
// src/hooks/useProducts.js — NEW
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

function buildParams(filters, page, limit) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  params.set('page', page);
  params.set('limit', limit);
  return params.toString();
}

export function useProducts(filters = {}, limit = 12) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);

    apiClient.get(`/products?${buildParams(filters, 1, limit)}`)
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, limit]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination || page >= pagination.totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await apiClient.get(`/products?${buildParams(filters, nextPage, limit)}`);
      setProducts((prev) => [...prev, ...data.products]);
      setPagination(data.pagination);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page, pagination, loadingMore, limit]);

  const hasMore = pagination ? page < pagination.totalPages : false;

  return { products, loading, loadingMore, error, loadMore, hasMore, pagination };
}
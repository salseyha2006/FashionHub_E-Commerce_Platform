// src/hooks/useCategories.js — UPDATED (added refetch so AdminProductForm can refresh the list after creating a category inline)
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    return apiClient.get('/categories').then((data) => setCategories(data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient.get('/categories')
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { categories, loading, refetch };
}

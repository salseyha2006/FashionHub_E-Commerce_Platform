// src/hooks/useProduct.js
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchProduct = useCallback(() => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    apiClient.get(`/products/${id}`)
      .then(setProduct)
      .catch((err) => { setError(err.message); setErrorStatus(err.status); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (id) fetchProduct(); }, [id, fetchProduct]);

  return { product, loading, error, errorStatus, refetch: fetchProduct };
}
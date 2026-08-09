// src/hooks/useOrder.js
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

export function useOrder(id) {
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchOrder = useCallback(() => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    apiClient.get(`/orders/${id}`, { token })
      .then(setOrder)
      .catch((err) => { setError(err.message); setErrorStatus(err.status); })
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => { if (id) fetchOrder(); }, [id, fetchOrder]);

  return { order, loading, error, errorStatus, refetch: fetchOrder };
}
// src/hooks/useOrders.js — NEW
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

export function useOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get('/orders', { token })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
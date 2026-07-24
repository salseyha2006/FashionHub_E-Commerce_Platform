// src/hooks/useSettings.js
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    return apiClient.get('/settings')
      .then((data) => { setSettings(data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/settings')
      .then((data) => { if (!cancelled) { setSettings(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { settings, loading, error, refetch };
}
// src/hooks/useBanners.js — NEW
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export function useBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/banners')
      .then(setBanners)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { banners, loading };
}
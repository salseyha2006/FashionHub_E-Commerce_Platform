// src/context/ThemeContext.jsx — Phase 10: Theme & Branding Engine
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { applyTheme, getCachedTheme } from '../utils/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getCachedTheme());

  // Paint the cached theme (if any) synchronously on mount so returning
  // visitors never see a flash of the default pink before their store's
  // real brand color loads.
  useEffect(() => {
    const cached = getCachedTheme();
    if (cached) applyTheme(cached);
  }, []);

  const refresh = useCallback(() => {
    return apiClient.get('/settings')
      .then((data) => {
        applyTheme(data);
        setTheme(data);
        return data;
      })
      .catch(() => {
        // Non-fatal: keep whatever theme (default or cached) is already painted.
      });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme: refresh }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

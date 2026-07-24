// src/context/WishlistContext.jsx — NEW
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'fh_wishlist';

// NOTE: FR-09 (Wishlist) was never built as a backend feature in Phases 3/4
// — there's no wishlist table or endpoint. This persists to localStorage
// only, per-device. Swap for real API calls once a wishlist endpoint exists.
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const isWishlisted = useCallback((productId) => ids.includes(productId), [ids]);

  const toggle = useCallback((productId) => {
    setIds((prev) =>
      prev.includes(productId) ? prev.filter((i) => i !== productId) : [...prev, productId]
    );
  }, []);

  return (
    <WishlistContext.Provider value={{ ids, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
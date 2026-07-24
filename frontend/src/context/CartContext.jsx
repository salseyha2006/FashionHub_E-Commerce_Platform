// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'fh_guest_cart';

function loadGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]); // server cart (logged-in users)
  const [guestItems, setGuestItems] = useState(loadGuestCart);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const wasAuthenticated = useRef(isAuthenticated);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.get('/cart', { token });
      setItems(data.items);
      setSubtotal(data.subtotal);
    } catch {
      // Silent — badge just keeps its last known value rather than erroring the whole app
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // The moment a guest logs in/registers, push their local cart into the
  // server cart, then clear localStorage. Runs once per false→true transition.
  useEffect(() => {
    async function mergeGuestCart() {
      const pending = loadGuestCart();
      if (pending.length === 0) {
        await fetchCart();
        return;
      }
      setLoading(true);
      for (const item of pending) {
        try {
          await apiClient.post('/cart', { variantId: item.variant.id, quantity: item.quantity }, { token });
        } catch {
          // Skip items that fail (e.g. sold out since it was added) — don't block the rest
        }
      }
      saveGuestCart([]);
      setGuestItems([]);
      await fetchCart();
    }

    if (isAuthenticated && !wasAuthenticated.current) {
      mergeGuestCart();
    } else if (isAuthenticated) {
      fetchCart();
    }
    wasAuthenticated.current = isAuthenticated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => { saveGuestCart(guestItems); }, [guestItems]);

  async function addToCart(variant, product, quantity) {
    if (isAuthenticated) {
      await apiClient.post('/cart', { variantId: variant.id, quantity }, { token });
      await fetchCart();
      return;
    }
    setGuestItems((prev) => {
      const idx = prev.findIndex((i) => i.variant.id === variant.id);
      const cap = (qty) => Math.min(qty, variant.stockQuantity);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: cap(next[idx].quantity + quantity) };
        return next;
      }
      return [...prev, {
        id: variant.id,
        quantity: cap(quantity),
        variant: {
          id: variant.id,
          size: variant.size,
          color: variant.color,
          stockQuantity: variant.stockQuantity,
          product: { id: product.id, name: product.name, price: product.price, image: product.images?.[0] || null },
        },
      }];
    });
  }

  async function updateQuantity(itemId, quantity) {
    if (isAuthenticated) {
      await apiClient.put(`/cart/${itemId}`, { quantity }, { token });
      await fetchCart();
      return;
    }
    setGuestItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  }

  async function removeItem(itemId) {
    if (isAuthenticated) {
      await apiClient.delete(`/cart/${itemId}`, { token });
      await fetchCart();
      return;
    }
    setGuestItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const activeItems = isAuthenticated ? items : guestItems;
  const activeSubtotal = isAuthenticated
    ? subtotal
    : guestItems.reduce((sum, i) => sum + Number(i.variant.product.price) * i.quantity, 0);
  const cartCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items: activeItems, subtotal: activeSubtotal, cartCount, loading, addToCart, updateQuantity, removeItem, refetch: fetchCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
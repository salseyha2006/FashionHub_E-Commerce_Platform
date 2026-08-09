// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first load
  useEffect(() => {
    const storedToken = localStorage.getItem('fh_token');
    const storedUser = localStorage.getItem('fh_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('fh_token', data.token);
    localStorage.setItem('fh_user', JSON.stringify(data.user));
  }

  async function login(email, password) {
    const data = await apiClient.post('/auth/login', { email, password });
    persistSession(data);
    return data.user;
  }

  async function register(name, email, password, phone) {
    const data = await apiClient.post('/auth/register', { name, email, password, phone });
    persistSession(data);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fh_token');
    localStorage.removeItem('fh_user');
  }

  // Sync a profile update (name/email) from the server into local state,
  // so the UI reflects it immediately without a re-login.
  function updateUser(updatedUser) {
    setUser(updatedUser);
    localStorage.setItem('fh_user', JSON.stringify(updatedUser));
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    // Phase 12 — Roles & Permissions: 'admin' (owner) and 'staff' can both
    // reach the /admin area; individual pages/actions gate further on
    // hasPermission(key). Owner always passes hasPermission regardless of
    // the staff-only permissions array.
    hasAdminAccess: user?.role === 'admin' || user?.role === 'staff',
    hasPermission: (key) => user?.role === 'admin' || !!user?.permissions?.includes(key),
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
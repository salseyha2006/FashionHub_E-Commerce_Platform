// src/utils/currency.js
//
// Mirrors utils/theme.js's caching pattern: setCurrencySymbol() is called
// once /settings loads (from ThemeContext, which already fetches /settings
// on mount for the theme engine), and formatPrice()/getCurrencySymbol()
// can be used from anywhere — pages, components, admin screens — without
// needing to call useSettings() or prop-drill the symbol everywhere prices
// are shown.

const CACHE_KEY = 'fh_currency_cache';
let currentSymbol = null;

function readCache() {
  try {
    return sessionStorage.getItem(CACHE_KEY) || null;
  } catch {
    return null;
  }
}

/** Called once /settings loads (or is re-saved in Admin Settings) to set the active currency symbol. */
export function setCurrencySymbol(symbol) {
  currentSymbol = symbol || '$';
  try {
    sessionStorage.setItem(CACHE_KEY, currentSymbol);
  } catch {
    /* storage unavailable — non-fatal, just won't be cached across reloads */
  }
}

/** Returns the active currency symbol: current value, else cached, else '$'. */
export function getCurrencySymbol() {
  return currentSymbol || readCache() || '$';
}

/** Formats a number/string amount as a price string using the store's currency symbol. */
export function formatPrice(amount) {
  const n = Number(amount) || 0;
  return `${getCurrencySymbol()}${n.toFixed(2)}`;
}
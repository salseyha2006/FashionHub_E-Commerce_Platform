// src/utils/urlSafety.js — Phase 14: security hardening
//
// Admin-supplied URL fields (logo, favicon, bank QR image, OG image) get
// stored and later rendered back out (as <img src>, <link href>, etc.).
// Only allow http(s) URLs — rejects javascript:, data:, vbscript:, and
// other schemes that would turn a "paste a logo URL" field into a stored-
// XSS vector.
function isSafeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { isSafeUrl };

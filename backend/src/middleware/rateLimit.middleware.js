// src/middleware/rateLimit.middleware.js — Phase 14: security hardening
//
// Deliberately dependency-free (Map-based sliding window) rather than
// pulling in express-rate-limit, to avoid adding a new npm dependency for
// something this small. Keyed per authenticated user, not per IP, since
// admin/staff traffic is already authenticated by the time this runs.
// Not suitable for multi-instance deployments without a shared store
// (e.g. Redis) — fine for this project's current single-instance setup.
const buckets = new Map(); // userId -> array of request timestamps (ms)

function rateLimit({ windowMs = 15 * 60 * 1000, max = 30 } = {}) {
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const timestamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests — please slow down and try again shortly.',
      });
    }

    timestamps.push(now);
    buckets.set(key, timestamps);
    next();
  };
}

module.exports = { rateLimit };

// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { hasPermission } = require('../utils/permissions');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // decoded payload: { id, email, role }
    req.user = decoded;
    next();
  });
}

// Owner-only. Deliberately re-checks role + isActive against the database
// on every request instead of trusting the JWT payload alone, so that
// revoking someone's admin access (or deactivating them) takes effect
// immediately rather than only after their token expires. Used for Team
// management and anything else that must never be delegable to staff.
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (err) {
    console.error('requireAdmin check error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
}

// Phase 12 — Roles & Permissions: 'admin' always passes (owner, full
// access); 'staff' passes only if explicitly granted `key`. Also
// DB-verified per-request for the same reason as requireAdmin above.
function requirePermission(key) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, permissions: true, isActive: true },
      });

      if (!dbUser || !dbUser.isActive || !hasPermission(dbUser, key)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        });
      }

      next();
    } catch (err) {
      console.error('requirePermission check error:', err);
      return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
  };
}

module.exports = { authenticateToken, requireAdmin, requirePermission };

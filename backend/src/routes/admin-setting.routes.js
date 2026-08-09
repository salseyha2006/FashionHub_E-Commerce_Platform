// src/routes/admin-setting.routes.js
// Mounted at /api/admin/settings in app.js
const express = require('express');
const router = express.Router();
const {
  getSettings, updateSettings, listAuditLog, exportSettings, importSettings,
} = require('../controllers/setting.controller');
const { authenticateToken, requirePermission, requireAdmin } = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rateLimit.middleware');

const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.use(authenticateToken, requirePermission('manage_settings'));

router.get('/', getSettings);
router.put('/', writeLimiter, updateSettings);
router.get('/export', exportSettings);
router.put('/import', writeLimiter, importSettings);

// Owner-only within an already manage_settings-gated router: a staff
// member with manage_settings can still read/write settings, but seeing
// *who changed what* (including other staff's actions) is reserved for
// the owner.
router.get('/audit-log', requireAdmin, listAuditLog);

module.exports = router;
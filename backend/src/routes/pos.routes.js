// src/routes/pos.routes.js
// Mounted at /api/admin/pos in app.js
const express = require('express');
const router = express.Router();
const { searchPosVariants, checkoutPos } = require('../controllers/pos.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.use(authenticateToken, requirePermission('use_pos'));

router.get('/products', searchPosVariants);
router.post('/checkout', checkoutPos);

module.exports = router;

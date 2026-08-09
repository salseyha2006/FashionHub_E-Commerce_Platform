// src/routes/pos.routes.js
// Mounted at /api/admin/pos in app.js
const express = require('express');
const router = express.Router();
const { searchPosVariants, checkoutPos } = require('../controllers/pos.controller');
const { generateForPos, getPosKhqrStatus } = require('../controllers/khqr.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.use(authenticateToken, requirePermission('use_pos'));

router.get('/products', searchPosVariants);
router.post('/checkout', checkoutPos);

// KHQR (Bakong) auto-payment — stateless; the actual order is only created
// by /checkout once payment is confirmed.
router.post('/khqr/generate', generateForPos);
router.get('/khqr/status/:md5', getPosKhqrStatus);

module.exports = router;

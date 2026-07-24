// src/routes/admin-order.routes.js
// Mounted separately at /api/admin/orders in app.js (see note below)
const express = require('express');
const router = express.Router();
const { getAllOrdersAdmin, getOrderByIdAdmin, updateOrderStatus } = require('../controllers/order.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.use(authenticateToken, requirePermission('manage_orders'));

router.get('/', getAllOrdersAdmin);
router.get('/:id', getOrderByIdAdmin);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
// src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrdersAdmin,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

// Customer routes
router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getMyOrderById);

module.exports = router;
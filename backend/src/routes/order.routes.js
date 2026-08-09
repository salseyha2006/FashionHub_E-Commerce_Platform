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
const { generateForOrder, getOrderKhqrStatus } = require('../controllers/khqr.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

// Customer routes
router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getMyOrderById);

// KHQR (Bakong) auto-payment
router.post('/:id/khqr/generate', authenticateToken, generateForOrder);
router.get('/:id/khqr/status', authenticateToken, getOrderKhqrStatus);

module.exports = router;
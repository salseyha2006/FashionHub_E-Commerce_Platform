// src/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cart.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken); // all cart routes require a logged-in user

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);

module.exports = router;
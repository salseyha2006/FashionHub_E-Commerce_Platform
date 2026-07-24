// src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
} = require('../controllers/product.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.get('/', getProducts);
router.post('/bulk-import', authenticateToken, requirePermission('manage_products'), bulkImportProducts);
router.get('/:id', getProductById);
router.post('/', authenticateToken, requirePermission('manage_products'), createProduct);
router.put('/:id', authenticateToken, requirePermission('manage_products'), updateProduct);
router.delete('/:id', authenticateToken, requirePermission('manage_products'), deleteProduct);

module.exports = router;
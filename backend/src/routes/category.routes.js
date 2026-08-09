// src/routes/category.routes.js
const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategory,
} = require('../controllers/category.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.get('/', getCategories);
router.post('/', authenticateToken, requirePermission('manage_categories'), createCategory);
router.put('/:id', authenticateToken, requirePermission('manage_categories'), updateCategory);
router.delete('/:id', authenticateToken, requirePermission('manage_categories'), deleteCategory);
router.put('/:id/reorder', authenticateToken, requirePermission('manage_categories'), reorderCategory);

module.exports = router;
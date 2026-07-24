// backend/src/routes/admin-banner.routes.js — NEW
const express = require('express');
const router = express.Router();
const {
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanner,
} = require('../controllers/banner.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.use(authenticateToken, requirePermission('manage_banners'));

router.get('/', getAllBannersAdmin);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);
router.put('/:id/reorder', reorderBanner);

module.exports = router;
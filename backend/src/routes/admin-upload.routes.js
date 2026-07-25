// src/routes/admin-upload.routes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { uploadImages } = require('../controllers/upload.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.use(authenticateToken, requirePermission('manage_products'));

// Accepts up to 6 images in one request, field name: "images"
router.post('/images', upload.array('images', 6), uploadImages);

module.exports = router;
// src/routes/setting.routes.js
// Mounted at /api/settings in app.js — public, read-only, storefront-safe fields only
const express = require('express');
const router = express.Router();
const { getPublicSettings } = require('../controllers/setting.controller');

router.get('/', getPublicSettings);

module.exports = router;
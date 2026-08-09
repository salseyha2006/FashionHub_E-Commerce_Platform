// backend/src/routes/banner.routes.js — NEW
const express = require('express');
const router = express.Router();
const { getActiveBanners } = require('../controllers/banner.controller');

router.get('/', getActiveBanners);

module.exports = router;
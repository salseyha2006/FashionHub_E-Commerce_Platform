// backend/src/routes/admin-dashboard.routes.js — NEW
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, requirePermission('view_dashboard'), getDashboardStats);

module.exports = router;
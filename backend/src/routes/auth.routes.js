// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { register, login, updateProfile, changePassword } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.put('/me', authenticateToken, updateProfile);
router.put('/me/password', authenticateToken, changePassword);

module.exports = router;
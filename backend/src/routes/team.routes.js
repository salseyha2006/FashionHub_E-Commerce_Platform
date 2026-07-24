// src/routes/team.routes.js
// Mounted at /api/admin/team in app.js. Owner-only (requireAdmin) — never
// requirePermission — so staff can never manage other staff or themselves.
const express = require('express');
const router = express.Router();
const { listTeam, inviteTeamMember, updateTeamMember } = require('../controllers/team.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticateToken, requireAdmin);

router.get('/', listTeam);
router.post('/', inviteTeamMember);
router.put('/:id', updateTeamMember);

module.exports = router;

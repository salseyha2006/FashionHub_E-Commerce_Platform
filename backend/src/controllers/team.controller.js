// src/controllers/team.controller.js — Phase 12: Roles & Permissions
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { PERMISSIONS } = require('../utils/permissions');
const { validateTeamInviteInput, validateTeamUpdateInput } = require('../utils/validators');

const SALT_ROUNDS = 10;

function toTeamMember(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    permissions: u.permissions,
    isActive: u.isActive,
    createdAt: u.createdAt,
  };
}

// GET /api/admin/team — everyone with role=admin or role=staff, for visibility.
async function listTeam(req, res) {
  try {
    const members = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] } },
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json({
      success: true,
      data: { members: members.map(toTeamMember), availablePermissions: PERMISSIONS },
    });
  } catch (err) {
    console.error('List team error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while loading the team' });
  }
}

// POST /api/admin/team — invite a new staff account with a starting permission set.
async function inviteTeamMember(req, res) {
  try {
    const { name, email, password, permissions } = req.body;

    const errors = validateTeamInviteInput({ name, email, password, permissions });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const member = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'staff',
        permissions: permissions || [],
      },
    });

    return res.status(201).json({ success: true, data: { member: toTeamMember(member) } });
  } catch (err) {
    console.error('Invite team member error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while inviting this staff member' });
  }
}

// PUT /api/admin/team/:id — update a staff member's permissions or active status.
// Deliberately cannot change `role` here: the only way to become 'admin' is
// direct database access, never through this API — closes the privilege-
// escalation path where a staff member (or a bug) promotes anyone to owner.
async function updateTeamMember(req, res) {
  try {
    const { id } = req.params;
    const { permissions, isActive } = req.body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== 'staff') {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const errors = validateTeamUpdateInput({ permissions, isActive });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const member = await prisma.user.update({
      where: { id },
      data: {
        ...(permissions !== undefined && { permissions }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.status(200).json({ success: true, data: { member: toTeamMember(member) } });
  } catch (err) {
    console.error('Update team member error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while updating this staff member' });
  }
}

module.exports = { listTeam, inviteTeamMember, updateTeamMember };

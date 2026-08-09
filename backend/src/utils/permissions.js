// src/utils/permissions.js — Phase 12: Roles & Permissions
//
// 'admin' (the store owner / super-admin) always has every permission —
// it is not stored as a permissions array and can never be revoked via
// the Team API, only via direct database access. 'staff' accounts are
// granted a subset of PERMISSIONS explicitly; nothing is implied.

const PERMISSIONS = [
  'manage_products',
  'manage_categories',
  'manage_orders',
  'manage_banners',
  'manage_settings',
  'view_dashboard',
  'use_pos',
];

function hasPermission(user, key) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'staff') {
    return Array.isArray(user.permissions) && user.permissions.includes(key);
  }
  return false;
}

module.exports = { PERMISSIONS, hasPermission };

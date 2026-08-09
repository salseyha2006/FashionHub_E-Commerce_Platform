-- Phase 12: Roles & Permissions
--
-- Adds a delegable "staff" role sitting between customer and admin: staff
-- can be granted specific permissions (manage_products, manage_orders, …)
-- without ever being able to grant themselves more — team management and
-- theme/branding stay owner-only (role = 'admin'), enforced in application
-- code (requireAdmin), not just here.
--
-- NOTE: Postgres requires ALTER TYPE ... ADD VALUE to run outside a
-- transaction that also *uses* the new value. This migration file does not
-- reference 'staff' again below, so it is safe to run as-is on Postgres 12+.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'staff';

ALTER TABLE "users"
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "is_active"   BOOLEAN NOT NULL DEFAULT true;

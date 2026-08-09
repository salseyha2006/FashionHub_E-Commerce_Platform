-- Phase 10: Theme & Branding Engine
-- Adds admin-configurable theme fields onto the single store_settings row
-- so the storefront can be re-skinned (color, radius, font) without a code change.

ALTER TABLE "store_settings"
  ADD COLUMN "theme_primary_color" TEXT NOT NULL DEFAULT '#f4297d',
  ADD COLUMN "theme_radius_style"  TEXT NOT NULL DEFAULT 'rounded',
  ADD COLUMN "theme_font"          TEXT NOT NULL DEFAULT 'inter',
  ADD COLUMN "favicon_url"         TEXT;

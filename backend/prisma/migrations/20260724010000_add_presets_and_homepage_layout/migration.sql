-- Phase 11: Color/Size Presets moved out of hard-coded frontend arrays into
-- Admin-managed settings, plus a Homepage Section Manager (order + visibility
-- of homepage blocks) so Admin controls layout without a code deploy.

ALTER TABLE "store_settings"
  ADD COLUMN "color_presets"     JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "size_presets"      JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "homepage_sections" JSONB NOT NULL DEFAULT '[]';

-- Backfill the single existing settings row with the same defaults that
-- were previously hard-coded in AdminProductForm.jsx / Home.jsx, so nothing
-- visually changes for existing stores until an Admin edits them.
UPDATE "store_settings" SET
  "color_presets" = '[
    {"name":"Black","hex":"#000000"},{"name":"White","hex":"#FFFFFF"},
    {"name":"Gray","hex":"#9CA3AF"},{"name":"Red","hex":"#EF4444"},
    {"name":"Blue","hex":"#3B82F6"},{"name":"Navy","hex":"#1E3A8A"},
    {"name":"Green","hex":"#22C55E"},{"name":"Yellow","hex":"#EAB308"},
    {"name":"Pink","hex":"#EC4899"},{"name":"Purple","hex":"#A855F7"},
    {"name":"Orange","hex":"#F97316"},{"name":"Brown","hex":"#92400E"},
    {"name":"Beige","hex":"#D6C7A1"}
  ]'::jsonb,
  "size_presets" = '["XS","S","M","L","XL","XXL"]'::jsonb,
  "homepage_sections" = '[
    {"id":"hero","label":"Hero banner","visible":true},
    {"id":"categories","label":"Featured categories","visible":true},
    {"id":"featured","label":"Featured products","visible":true}
  ]'::jsonb
WHERE "color_presets" = '[]'::jsonb;

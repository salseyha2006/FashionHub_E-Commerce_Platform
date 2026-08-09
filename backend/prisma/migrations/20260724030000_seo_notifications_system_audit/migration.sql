-- Phase 13: SEO, Notifications & System settings
ALTER TABLE "store_settings"
  ADD COLUMN "seo_title"                TEXT,
  ADD COLUMN "seo_description"          TEXT,
  ADD COLUMN "og_image_url"             TEXT,
  ADD COLUMN "ga_id"                    TEXT,
  ADD COLUMN "smtp_host"                TEXT,
  ADD COLUMN "smtp_port"                INTEGER,
  ADD COLUMN "smtp_user"                TEXT,
  ADD COLUMN "smtp_password_encrypted"  TEXT,
  ADD COLUMN "notification_email_from"  TEXT,
  ADD COLUMN "maintenance_mode"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "default_language"         TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "timezone"                 TEXT NOT NULL DEFAULT 'Asia/Phnom_Penh';

-- Phase 14: Settings audit log
CREATE TABLE "setting_audit_logs" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_id"       UUID,
  "actor_name"     TEXT NOT NULL,
  "actor_email"    TEXT NOT NULL,
  "changed_fields" JSONB NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "setting_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "setting_audit_logs_created_at_idx" ON "setting_audit_logs"("created_at" DESC);

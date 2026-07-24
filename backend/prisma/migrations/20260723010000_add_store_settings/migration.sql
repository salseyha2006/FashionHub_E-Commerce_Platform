-- CreateTable: single-row store configuration
CREATE TABLE "store_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_name" TEXT NOT NULL DEFAULT 'FashionHub',
    "store_logo_url" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "store_address" TEXT,
    "currency_symbol" TEXT NOT NULL DEFAULT '$',
    "default_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "shipping_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "free_shipping_min" DECIMAL(10,2),
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "bank_account_name" TEXT,
    "bank_qr_image_url" TEXT,
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "bank_transfer_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- Seed: guarantee exactly one settings row always exists
INSERT INTO "store_settings" ("id", "updated_at")
SELECT gen_random_uuid(), CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "store_settings");
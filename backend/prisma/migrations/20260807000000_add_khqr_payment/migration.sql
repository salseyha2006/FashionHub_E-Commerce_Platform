-- AlterTable: KHQR (Bakong) auto-payment tracking on orders
ALTER TABLE "orders" ADD COLUMN "khqr_md5" TEXT;
ALTER TABLE "orders" ADD COLUMN "khqr_payload" TEXT;
ALTER TABLE "orders" ADD COLUMN "khqr_expires_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "paid_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "orders_khqr_md5_key" ON "orders"("khqr_md5");

-- AlterTable: KHQR (Bakong) settings on store_settings
ALTER TABLE "store_settings" ADD COLUMN "khqr_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "store_settings" ADD COLUMN "bakong_account_id" TEXT;
ALTER TABLE "store_settings" ADD COLUMN "bakong_merchant_name" TEXT;
ALTER TABLE "store_settings" ADD COLUMN "bakong_merchant_city" TEXT NOT NULL DEFAULT 'Phnom Penh';
ALTER TABLE "store_settings" ADD COLUMN "khqr_currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "store_settings" ADD COLUMN "bakong_token_encrypted" TEXT;

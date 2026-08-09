-- AlterTable: add invoice breakdown fields to orders
ALTER TABLE "orders" ADD COLUMN "subtotal_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill: existing orders had no tax/discount, so subtotal = total_amount
UPDATE "orders" SET "subtotal_amount" = "total_amount";
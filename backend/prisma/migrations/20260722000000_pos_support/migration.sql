-- AlterEnum: add "cash" for POS walk-in checkout
ALTER TYPE "PaymentMethod" ADD VALUE 'cash';

-- AlterTable: add optional SKU for barcode/SKU scanning in POS
ALTER TABLE "product_variants" ADD COLUMN "sku" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

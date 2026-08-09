-- AlterTable: KHQR needs the underlying account number + bank name behind
-- the Bakong routing alias (bakong_account_id) — without these the bank
-- app that scans the code can't resolve which account to credit and
-- rejects the QR as "Invalid Qr Merchant Data".
ALTER TABLE "store_settings" ADD COLUMN "bakong_account_number" TEXT;
ALTER TABLE "store_settings" ADD COLUMN "bakong_acquiring_bank" TEXT;

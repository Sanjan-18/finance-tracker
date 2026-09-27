/*
  Finance Tracker - Transaction Migration
*/

-- Drop the existing transaction -> category foreign key temporarily
ALTER TABLE "Transaction"
DROP CONSTRAINT IF EXISTS "Transaction_categoryId_fkey";


-- Update existing categories before making fields required
ALTER TABLE "Category"
ADD COLUMN IF NOT EXISTS "type" "TransactionType";

ALTER TABLE "Category"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Assign existing categories to the currently registered user
UPDATE "Category"
SET
  "userId" = 'cmu87bs7w0000rylsh70dkt11',
  "type" = 'EXPENSE',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "userId" IS NULL;

-- Give any remaining categories safe values
UPDATE "Category"
SET
  "type" = 'EXPENSE'
WHERE "type" IS NULL;

UPDATE "Category"
SET
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;


-- Make the new Category fields required
ALTER TABLE "Category"
ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "Category"
ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Category"
ALTER COLUMN "userId" SET NOT NULL;


-- Existing Transaction descriptions may be NULL.
-- Give old transactions a safe description.
UPDATE "Transaction"
SET "description" = 'Transaction'
WHERE "description" IS NULL;


-- Make Transaction description required
ALTER TABLE "Transaction"
ALTER COLUMN "description" SET NOT NULL;


-- Make transaction category optional
ALTER TABLE "Transaction"
ALTER COLUMN "categoryId" DROP NOT NULL;


-- Date should default to the current time
ALTER TABLE "Transaction"
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;


-- Remove old columns that are no longer used
ALTER TABLE "Category"
DROP COLUMN IF EXISTS "color";

ALTER TABLE "Category"
DROP COLUMN IF EXISTS "icon";

ALTER TABLE "Transaction"
DROP COLUMN IF EXISTS "paymentMethod";


-- Add unique category constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_userId_key"
ON "Category"("name", "userId");


-- Restore the category relationship
ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_categoryId_fkey"
FOREIGN KEY ("categoryId")
REFERENCES "Category"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
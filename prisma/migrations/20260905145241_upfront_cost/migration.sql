-- DropIndex
DROP INDEX "area_aliases_idx";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "upfrontEurCents" INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing rows. Tenant-side agency commission in Albania is
-- customarily half of the first month's rent.
UPDATE "Listing"
SET "upfrontEurCents" =
  "priceEurCents"
  + ("priceEurCents" * "depositMonths")
  + (CASE WHEN "agencyFee" THEN "priceEurCents" / 2 ELSE 0 END)
WHERE "direction" = 'OFFER';

-- Sorting by what you actually pay at signing is the site's differentiating sort,
-- so it gets the same partial-index treatment as price.
CREATE INDEX "listing_live_upfront_idx" ON "Listing"
  ("cityId", "upfrontEurCents")
  WHERE "status" = 'ACTIVE' AND "moderationState" = 'APPROVED';

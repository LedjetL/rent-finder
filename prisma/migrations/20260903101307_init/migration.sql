-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('OFFER', 'WANTED');

-- CreateEnum
CREATE TYPE "PropertyKind" AS ENUM ('ROOM', 'WHOLE_UNIT', 'SHORT_TERM');

-- CreateEnum
CREATE TYPE "Layout" AS ENUM ('GARSONIERE', 'ONE_PLUS_ONE', 'TWO_PLUS_ONE', 'THREE_PLUS_ONE', 'FOUR_PLUS_ONE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'ALL');

-- CreateEnum
CREATE TYPE "Furnished" AS ENUM ('FULL', 'PARTIAL', 'NONE');

-- CreateEnum
CREATE TYPE "Heating" AS ENUM ('AC', 'CENTRAL', 'ELECTRIC', 'WOOD', 'NONE');

-- CreateEnum
CREATE TYPE "BathroomType" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "GenderPref" AS ENUM ('ANY', 'FEMALE', 'MALE', 'MIXED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'TAKEN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ModerationState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SHADOW');

-- CreateEnum
CREATE TYPE "VerificationKind" AS ENUM ('PHONE', 'ID', 'OWNERSHIP_DOC', 'MET_IN_PERSON');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventVerb" AS ENUM ('LISTING_PUBLISHED', 'LISTING_VIEWED', 'LISTING_MARKED_TAKEN', 'SEEKER_PROFILE_PUBLISHED', 'CONTACT_REVEALED', 'MATCH_CONFIRMED', 'LISTING_REPORTED', 'USER_REGISTERED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SCAM', 'WRONG_PRICE', 'ALREADY_RENTED', 'AGENCY_POSING', 'STOLEN_PHOTOS', 'OTHER');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'AL',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "defaultCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "blurbSq" TEXT,
    "blurbEn" TEXT,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "phoneVerifiedAt" TIMESTAMP(3),
    "phoneHash" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'sq',
    "birthYear" INTEGER,
    "languages" TEXT NOT NULL DEFAULT 'sq',
    "bio" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "VerificationKind" NOT NULL,
    "state" "VerificationState" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "areaId" TEXT,
    "ownerId" TEXT NOT NULL,
    "ownerPhoneHash" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "propertyKind" "PropertyKind" NOT NULL,
    "layout" "Layout",
    "priceAmountCents" INTEGER NOT NULL,
    "priceCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "priceEurCents" INTEGER NOT NULL,
    "fxRateId" TEXT,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "utilitiesEurCents" INTEGER,
    "depositMonths" INTEGER NOT NULL DEFAULT 1,
    "agencyFee" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "addressHint" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "sizeM2" INTEGER,
    "roomSizeM2" INTEGER,
    "floor" INTEGER,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "furnished" "Furnished" NOT NULL DEFAULT 'FULL',
    "heating" "Heating" NOT NULL DEFAULT 'AC',
    "bathroom" "BathroomType" NOT NULL DEFAULT 'SHARED',
    "balcony" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "internet" BOOLEAN NOT NULL DEFAULT true,
    "washingMachine" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableTo" TIMESTAMP(3),
    "minStayMonths" INTEGER,
    "flatmatesTotal" INTEGER,
    "flatmatesGender" "GenderPref",
    "wantedGender" "GenderPref",
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "occupationPref" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "moderationState" "ModerationState" NOT NULL DEFAULT 'PENDING',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "firstPublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingTranslation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'human',

    CONSTRAINT "ListingTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAreaPref" (
    "listingId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "ListingAreaPref_pkey" PRIMARY KEY ("listingId","areaId")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "phash" BIGINT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "detail" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" BIGSERIAL NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "verb" "EventVerb" NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL,
    "base" "Currency" NOT NULL,
    "quote" "Currency" NOT NULL,
    "rateScaled" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "Area_cityId_idx" ON "Area"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_cityId_slug_key" ON "Area"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneHash_idx" ON "User"("phoneHash");

-- CreateIndex
CREATE INDEX "Verification_state_idx" ON "Verification"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_userId_kind_key" ON "Verification"("userId", "kind");

-- CreateIndex
CREATE INDEX "Listing_cityId_direction_propertyKind_priceEurCents_idx" ON "Listing"("cityId", "direction", "propertyKind", "priceEurCents");

-- CreateIndex
CREATE INDEX "Listing_cityId_areaId_priceEurCents_idx" ON "Listing"("cityId", "areaId", "priceEurCents");

-- CreateIndex
CREATE INDEX "Listing_cityId_availableFrom_idx" ON "Listing"("cityId", "availableFrom");

-- CreateIndex
CREATE INDEX "Listing_ownerPhoneHash_status_idx" ON "Listing"("ownerPhoneHash", "status");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingTranslation_listingId_locale_key" ON "ListingTranslation"("listingId", "locale");

-- CreateIndex
CREATE INDEX "ListingAreaPref_areaId_idx" ON "ListingAreaPref"("areaId");

-- CreateIndex
CREATE INDEX "Media_listingId_sort_idx" ON "Media"("listingId", "sort");

-- CreateIndex
CREATE INDEX "Media_phash_idx" ON "Media"("phash");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- CreateIndex
CREATE INDEX "Report_resolved_createdAt_idx" ON "Report"("resolved", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_listingId_reporterId_key" ON "Report"("listingId", "reporterId");

-- CreateIndex
CREATE INDEX "Event_subjectType_subjectId_occurredAt_idx" ON "Event"("subjectType", "subjectId", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_verb_occurredAt_idx" ON "Event"("verb", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_actorUserId_occurredAt_idx" ON "Event"("actorUserId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_base_quote_validFrom_key" ON "FxRate"("base", "quote", "validFrom");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_fxRateId_fkey" FOREIGN KEY ("fxRateId") REFERENCES "FxRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingTranslation" ADD CONSTRAINT "ListingTranslation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAreaPref" ADD CONSTRAINT "ListingAreaPref_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAreaPref" ADD CONSTRAINT "ListingAreaPref_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────
-- Hand-written additions. Prisma cannot express CHECK constraints,
-- partial indexes, GIN indexes on scalar arrays, or triggers.
-- ─────────────────────────────────────────────────────────────────────

-- An OFFER must say where it is; a WANTED row uses ListingAreaPref instead.
ALTER TABLE "Listing" ADD CONSTRAINT "offer_needs_area"
  CHECK ("direction" <> 'OFFER' OR "areaId" IS NOT NULL);

-- Gender preference is only lawful on a room in a shared home, never on a whole
-- unit. Enforced in the database so no code path can bypass it. See docs/strategy.md.
ALTER TABLE "Listing" ADD CONSTRAINT "gender_pref_rooms_only"
  CHECK ("propertyKind" = 'ROOM' OR "wantedGender" IS NULL);

ALTER TABLE "Listing" ADD CONSTRAINT "price_positive"
  CHECK ("priceEurCents" > 0 AND "priceAmountCents" > 0);

ALTER TABLE "Listing" ADD CONSTRAINT "dates_ordered"
  CHECK ("availableTo" IS NULL OR "availableTo" > "availableFrom");

ALTER TABLE "Listing" ADD CONSTRAINT "age_range_ordered"
  CHECK ("ageMin" IS NULL OR "ageMax" IS NULL OR "ageMin" <= "ageMax");

-- 95% of traffic touches only live, approved rows. Taken and rejected listings
-- accumulate forever and would otherwise bloat every index.
CREATE INDEX "listing_live_idx" ON "Listing"
  ("cityId", "direction", "propertyKind", "priceEurCents", "availableFrom")
  WHERE "status" = 'ACTIVE' AND "moderationState" = 'APPROVED';

CREATE INDEX "listing_live_area_idx" ON "Listing"
  ("cityId", "areaId", "priceEurCents")
  WHERE "status" = 'ACTIVE' AND "moderationState" = 'APPROVED';

-- The zone names people actually type: "te Komuna", "te 21-shi", "Studenti".
CREATE INDEX "area_aliases_idx" ON "Area" USING GIN ("aliases");

-- Free-text search, stage 2. unaccent matters more than any stemmer here: people
-- type "Selite" for "Selitë" and "Laprake" for "Laprakë", and Postgres ships no
-- Albanian stemmer. Without this, roughly half of typed zone searches return nothing.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent() is STABLE, not IMMUTABLE, so Postgres refuses it in an index
-- expression. Pinning the dictionary explicitly makes the wrapper safe to mark
-- IMMUTABLE. Queries must call this same function, not unaccent() directly, or
-- the planner will not use the index.
CREATE OR REPLACE FUNCTION "rf_unaccent"(text) RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;

CREATE INDEX "listing_title_trgm_idx" ON "Listing"
  USING GIN (lower("rf_unaccent"("title")) gin_trgm_ops);

CREATE INDEX "area_name_trgm_idx" ON "Area"
  USING GIN (lower("rf_unaccent"("name")) gin_trgm_ops);

-- The event log is append-only. Enforced with a trigger rather than role grants so
-- the guarantee travels with the schema instead of the deployment.
CREATE OR REPLACE FUNCTION "event_is_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Event is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "event_no_update" BEFORE UPDATE ON "Event"
  FOR EACH ROW EXECUTE FUNCTION "event_is_append_only"();

CREATE TRIGGER "event_no_delete" BEFORE DELETE ON "Event"
  FOR EACH ROW EXECUTE FUNCTION "event_is_append_only"();

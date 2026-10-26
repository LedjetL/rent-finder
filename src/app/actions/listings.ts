"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toEurCents } from "@/lib/domain";
import { MAX_PHOTOS, findDuplicates, processPhoto } from "@/lib/photos";
import type { Currency, Direction } from "@/generated/prisma/enums";

/**
 * Publishing and retiring listings.
 *
 * Both directions go through here: an OFFER ("I have a room") and a WANTED
 * ("I need one") are the same table with `direction` flipped, so there is one
 * validation path, one moderation queue and one event stream for both.
 */

const Common = z.object({
  direction: z.enum(["OFFER", "WANTED"]),
  propertyKind: z.enum(["ROOM", "WHOLE_UNIT", "SHORT_TERM"]),
  layout: z
    .enum(["GARSONIERE", "ONE_PLUS_ONE", "TWO_PLUS_ONE", "THREE_PLUS_ONE", "FOUR_PLUS_ONE"])
    .optional(),
  title: z.string().trim().min(8).max(160),
  description: z.string().trim().min(30).max(4000),
  priceAmount: z.coerce.number().int().positive().max(10_000_000),
  priceCurrency: z.enum(["EUR", "ALL"]),
  availableFrom: z.coerce.date(),
  minStayMonths: z.coerce.number().int().min(1).max(60).optional(),
});

const OfferOnly = z.object({
  areaSlug: z.string().min(1),
  depositMonths: z.coerce.number().int().min(0).max(6),
  agencyFee: z.coerce.boolean(),
  utilitiesIncluded: z.coerce.boolean(),
  utilitiesEur: z.coerce.number().int().min(0).max(1000).optional(),
  sizeM2: z.coerce.number().int().min(5).max(1000).optional(),
  roomSizeM2: z.coerce.number().int().min(4).max(200).optional(),
  floor: z.coerce.number().int().min(-2).max(60).optional(),
  hasElevator: z.coerce.boolean(),
  furnished: z.enum(["FULL", "PARTIAL", "NONE"]),
  heating: z.enum(["AC", "CENTRAL", "ELECTRIC", "WOOD", "NONE"]),
  bathroom: z.enum(["PRIVATE", "SHARED"]),
  balcony: z.coerce.boolean(),
  parking: z.coerce.boolean(),
  internet: z.coerce.boolean(),
  washingMachine: z.coerce.boolean(),
  petsAllowed: z.coerce.boolean(),
  smokingAllowed: z.coerce.boolean(),
  flatmatesTotal: z.coerce.number().int().min(0).max(12).optional(),
  wantedGender: z.enum(["ANY", "FEMALE", "MALE"]).optional(),
  addressHint: z.string().trim().max(120).optional(),
});

const flag = (v: FormDataEntryValue | null) => v === "1" || v === "on";
const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? undefined : s;
};

export async function createListing(formData: FormData) {
  // Server Actions are reachable by direct POST — authorise inside the action.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/listings/new");

  const direction = (formData.get("direction") === "WANTED" ? "WANTED" : "OFFER") as Direction;

  const base = Common.safeParse({
    direction,
    propertyKind: formData.get("propertyKind"),
    layout: opt(formData.get("layout")),
    title: formData.get("title"),
    description: formData.get("description"),
    priceAmount: formData.get("priceAmount"),
    priceCurrency: formData.get("priceCurrency") ?? "EUR",
    availableFrom: formData.get("availableFrom"),
    minStayMonths: opt(formData.get("minStayMonths")),
  });

  const target = direction === "WANTED" ? "/seekers/new" : "/listings/new";
  if (!base.success) redirect(`${target}?error=invalid`);

  const d = base.data;
  const tirana = await prisma.city.findUnique({ where: { slug: "tirana" }, select: { id: true } });
  if (!tirana) redirect(`${target}?error=invalid`);

  const priceAmountCents = d.priceAmount * 100;
  const priceEurCents = toEurCents(priceAmountCents, d.priceCurrency as Currency);

  const owner = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phoneHash: true, phoneVerifiedAt: true, locale: true },
  });
  if (!owner) redirect(`${target}?error=invalid`);

  // The moderation hook, real from day one: an unverified phone means the listing
  // is held for a human rather than published. Manual now, automatable later.
  const moderationState = owner.phoneVerifiedAt ? "APPROVED" : "PENDING";

  if (direction === "WANTED") {
    const areaSlugs = formData.getAll("areas").map(String).filter(Boolean);
    const areas = await prisma.area.findMany({
      where: { slug: { in: areaSlugs }, city: { slug: "tirana" } },
      select: { id: true },
    });

    const listing = await prisma.listing.create({
      data: {
        cityId: tirana.id,
        areaId: null, // WANTED rows use areaPrefs — enforced by CHECK constraint
        ownerId: user.id,
        ownerPhoneHash: owner.phoneHash,
        direction: "WANTED",
        propertyKind: d.propertyKind,
        layout: d.layout ?? null,
        title: d.title,
        description: d.description,
        priceAmountCents,
        priceCurrency: d.priceCurrency as Currency,
        priceEurCents,
        upfrontEurCents: priceEurCents,
        availableFrom: d.availableFrom,
        minStayMonths: d.minStayMonths ?? null,
        occupationPref: opt(formData.get("occupationPref")) ?? null,
        petsAllowed: flag(formData.get("petsAllowed")),
        smokingAllowed: flag(formData.get("smokingAllowed")),
        status: "ACTIVE",
        moderationState,
        firstPublishedAt: new Date(),
        translations: {
          create: {
            locale: owner.locale === "en" ? "en" : "sq",
            title: d.title,
            description: d.description,
            source: "human",
          },
        },
        areaPrefs: { create: areas.map((a) => ({ areaId: a.id })) },
      },
      select: { id: true },
    });

    await prisma.event.create({
      data: {
        verb: "SEEKER_PROFILE_PUBLISHED",
        subjectType: "Listing",
        subjectId: listing.id,
        actorUserId: user.id,
        metadata: { budgetEurCents: priceEurCents },
      },
    });

    revalidatePath("/seekers");
    redirect("/seekers");
  }

  // ── OFFER ──
  const offer = OfferOnly.safeParse({
    areaSlug: formData.get("areaSlug"),
    depositMonths: formData.get("depositMonths") ?? 1,
    agencyFee: flag(formData.get("agencyFee")),
    utilitiesIncluded: flag(formData.get("utilitiesIncluded")),
    utilitiesEur: opt(formData.get("utilitiesEur")),
    sizeM2: opt(formData.get("sizeM2")),
    roomSizeM2: opt(formData.get("roomSizeM2")),
    floor: opt(formData.get("floor")),
    hasElevator: flag(formData.get("hasElevator")),
    furnished: formData.get("furnished") ?? "FULL",
    heating: formData.get("heating") ?? "AC",
    bathroom: formData.get("bathroom") ?? "SHARED",
    balcony: flag(formData.get("balcony")),
    parking: flag(formData.get("parking")),
    internet: flag(formData.get("internet")),
    washingMachine: flag(formData.get("washingMachine")),
    petsAllowed: flag(formData.get("petsAllowed")),
    smokingAllowed: flag(formData.get("smokingAllowed")),
    flatmatesTotal: opt(formData.get("flatmatesTotal")),
    wantedGender: opt(formData.get("wantedGender")),
    addressHint: opt(formData.get("addressHint")),
  });
  if (!offer.success) redirect(`${target}?error=invalid`);
  const o = offer.data;

  const area = await prisma.area.findFirst({
    where: { slug: o.areaSlug, city: { slug: "tirana" } },
    select: { id: true, lat: true, lng: true },
  });
  if (!area) redirect(`${target}?error=invalid`);

  const isRoom = d.propertyKind === "ROOM";
  const upfrontEurCents =
    priceEurCents +
    priceEurCents * o.depositMonths +
    (o.agencyFee ? Math.round(priceEurCents / 2) : 0);

  const listing = await prisma.listing.create({
    data: {
      cityId: tirana.id,
      areaId: area.id,
      ownerId: user.id,
      ownerPhoneHash: owner.phoneHash,
      direction: "OFFER",
      propertyKind: d.propertyKind,
      layout: d.layout ?? null,
      title: d.title,
      description: d.description,
      addressHint: o.addressHint ?? null,
      // Pin jitters inside the zone: we never publish a precise address.
      lat: area.lat + (Math.random() - 0.5) * 0.006,
      lng: area.lng + (Math.random() - 0.5) * 0.008,
      priceAmountCents,
      priceCurrency: d.priceCurrency as Currency,
      priceEurCents,
      upfrontEurCents,
      utilitiesIncluded: o.utilitiesIncluded,
      utilitiesEurCents: o.utilitiesIncluded ? null : (o.utilitiesEur ?? 0) * 100 || null,
      depositMonths: o.depositMonths,
      agencyFee: o.agencyFee,
      sizeM2: o.sizeM2 ?? null,
      roomSizeM2: isRoom ? (o.roomSizeM2 ?? null) : null,
      floor: o.floor ?? null,
      hasElevator: o.hasElevator,
      furnished: o.furnished,
      heating: o.heating,
      bathroom: isRoom ? o.bathroom : "PRIVATE",
      balcony: o.balcony,
      parking: o.parking,
      internet: o.internet,
      washingMachine: o.washingMachine,
      petsAllowed: o.petsAllowed,
      smokingAllowed: o.smokingAllowed,
      availableFrom: d.availableFrom,
      minStayMonths: d.minStayMonths ?? null,
      flatmatesTotal: isRoom ? (o.flatmatesTotal ?? null) : null,
      // CHECK constraint gender_pref_rooms_only: never set on a whole unit.
      wantedGender: isRoom ? (o.wantedGender ?? null) : null,
      status: "ACTIVE",
      moderationState,
      firstPublishedAt: new Date(),
      translations: {
        create: {
          locale: owner.locale === "en" ? "en" : "sq",
          title: d.title,
          description: d.description,
          source: "human",
        },
      },
    },
    select: { id: true },
  });

  // ── photos ──
  // Processed after the insert because the files are stored under the listing id.
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);

  const stored = (
    await Promise.all(files.map((f, i) => processPhoto(listing.id, i, f)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  if (stored.length > 0) {
    await prisma.media.createMany({
      data: stored.map((p, i) => ({
        listingId: listing.id,
        url: p.url,
        sort: i,
        width: p.width,
        height: p.height,
        phash: p.phash,
      })),
    });
  }

  // Photos lifted from another portal are a core scam pattern, so a near-identical
  // image already on the site holds the listing for review rather than blocking it
  // outright — the same photo can legitimately reappear when a flat is re-let.
  const duplicates = await findDuplicates(
    stored.map((p) => p.phash),
    listing.id,
  );

  let finalState = moderationState;
  if (duplicates.length > 0) {
    finalState = "PENDING";
    await prisma.listing.update({
      where: { id: listing.id },
      data: { moderationState: "PENDING" },
    });
  }

  await prisma.event.create({
    data: {
      verb: "LISTING_PUBLISHED",
      subjectType: "Listing",
      subjectId: listing.id,
      actorUserId: user.id,
      metadata: {
        area: o.areaSlug,
        priceEurCents,
        upfrontEurCents,
        moderationState: finalState,
        photos: stored.length,
        duplicateOf: duplicates.map((d) => d.listingId).slice(0, 5),
      },
    },
  });

  revalidatePath("/listings");
  redirect(`/listings/${listing.id}`);
}

/**
 * Retiring a listing, with attribution.
 *
 * Because chat is off-platform, CONTACT_REVEALED → LISTING_MARKED_TAKEN is the
 * entire funnel we can observe. Recording *who* it went to is what turns the log
 * from a traffic counter into an answer to "did this platform produce matches?",
 * so the form offers the people who actually revealed contact on this listing.
 */
export async function markTaken(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const listingId = String(formData.get("listingId") ?? "");
  const takenBy = opt(formData.get("takenByUserId"));

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: user.id },
    select: { id: true, firstPublishedAt: true },
  });
  if (!listing) redirect("/account?error=notfound");

  const daysToFill = listing.firstPublishedAt
    ? Math.round((Date.now() - listing.firstPublishedAt.getTime()) / 86400000)
    : null;

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: { status: "TAKEN" } }),
    prisma.event.create({
      data: {
        verb: "LISTING_MARKED_TAKEN",
        subjectType: "Listing",
        subjectId: listing.id,
        actorUserId: user.id,
        // Time-to-fill is the number the whole business turns on (docs/strategy.md).
        metadata: { takenByUserId: takenBy ?? null, daysToFill },
      },
    }),
    ...(takenBy
      ? [
          prisma.event.create({
            data: {
              verb: "MATCH_CONFIRMED" as const,
              subjectType: "Listing",
              subjectId: listing.id,
              actorUserId: takenBy,
              metadata: { ownerId: user.id, daysToFill },
            },
          }),
        ]
      : []),
  ]);

  revalidatePath("/account");
  revalidatePath(`/listings/${listing.id}`);
  redirect("/account?done=taken");
}

export async function relist(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const listingId = String(formData.get("listingId") ?? "");

  // firstPublishedAt is deliberately not touched — recency cannot be gamed by
  // taking a listing down and putting it back up.
  await prisma.listing.updateMany({
    where: { id: listingId, ownerId: user.id },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/account");
  redirect("/account");
}

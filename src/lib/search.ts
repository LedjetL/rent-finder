import "server-only";
import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import type {
  BathroomType,
  Direction,
  Furnished,
  GenderPref,
  Layout,
  PropertyKind,
} from "@/generated/prisma/enums";
import { CAMPUSES, distanceKm } from "./tirana";
import { type Sort, isOneOf, SORTS } from "./domain";

/**
 * Search.
 *
 * Stage 1 is plain Postgres against the partial indexes in the init migration. That
 * is genuinely fast enough into the tens of thousands of listings, and everything
 * here sits behind one narrow interface so swapping in Typesense or Meilisearch
 * later is a single class and no caller changes.
 */

export const PAGE_SIZE = 24;

export type SearchCriteria = {
  direction: Direction;
  propertyKind?: PropertyKind;
  areaSlug?: string;
  layout?: Layout;
  minEur?: number;
  maxEur?: number;
  availableFrom?: Date;
  furnished?: Furnished;
  bathroom?: BathroomType;
  gender?: GenderPref;
  noAgencyFee?: boolean;
  utilitiesIncluded?: boolean;
  pets?: boolean;
  parking?: boolean;
  balcony?: boolean;
  washer?: boolean;
  campusSlug?: string;
  maxWalkMinutes?: number;
  q?: string;
  sort: Sort;
  page: number;
};

type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const num = (v: string | string[] | undefined): number | undefined => {
  const s = one(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const bool = (v: string | string[] | undefined): boolean | undefined =>
  one(v) === "1" ? true : undefined;

const enumOf = <T extends readonly string[]>(
  allowed: T,
  v: string | string[] | undefined,
): T[number] | undefined => {
  const s = one(v);
  return s && (allowed as readonly string[]).includes(s) ? (s as T[number]) : undefined;
};

const PROPERTY_KINDS = ["ROOM", "WHOLE_UNIT", "SHORT_TERM"] as const;
const LAYOUTS = [
  "GARSONIERE", "ONE_PLUS_ONE", "TWO_PLUS_ONE", "THREE_PLUS_ONE", "FOUR_PLUS_ONE",
] as const;
const FURNISHED = ["FULL", "PARTIAL", "NONE"] as const;
const BATHROOMS = ["PRIVATE", "SHARED"] as const;
const GENDERS = ["ANY", "FEMALE", "MALE", "MIXED"] as const;

export function parseCriteria(raw: Raw, direction: Direction = "OFFER"): SearchCriteria {
  const fromRaw = one(raw.from);
  const parsedFrom = fromRaw ? new Date(fromRaw) : undefined;

  return {
    direction,
    propertyKind: enumOf(PROPERTY_KINDS, raw.kind),
    areaSlug: one(raw.area) || undefined,
    layout: enumOf(LAYOUTS, raw.layout),
    minEur: num(raw.min),
    maxEur: num(raw.max),
    availableFrom:
      parsedFrom && !Number.isNaN(parsedFrom.valueOf()) ? parsedFrom : undefined,
    furnished: enumOf(FURNISHED, raw.furnished),
    bathroom: enumOf(BATHROOMS, raw.bath),
    gender: enumOf(GENDERS, raw.gender),
    noAgencyFee: bool(raw.nofee),
    utilitiesIncluded: bool(raw.bills),
    pets: bool(raw.pets),
    parking: bool(raw.parking),
    balcony: bool(raw.balcony),
    washer: bool(raw.washer),
    campusSlug: one(raw.campus) || undefined,
    maxWalkMinutes: num(raw.walk),
    q: one(raw.q)?.trim() || undefined,
    sort: isOneOf(SORTS, one(raw.sort)) ? (one(raw.sort) as Sort) : "newest",
    page: Math.max(1, num(raw.page) ?? 1),
  };
}

/** Turn criteria back into a query string, for filter links and pagination. */
export function criteriaToQuery(
  c: SearchCriteria,
  overrides: Partial<Record<string, string | number | undefined>> = {},
): string {
  const p = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || v === false) return;
    p.set(k, v === true ? "1" : String(v));
  };

  set("kind", c.propertyKind);
  set("area", c.areaSlug);
  set("layout", c.layout);
  set("min", c.minEur);
  set("max", c.maxEur);
  set("from", c.availableFrom?.toISOString().slice(0, 10));
  set("furnished", c.furnished);
  set("bath", c.bathroom);
  set("gender", c.gender);
  set("nofee", c.noAgencyFee);
  set("bills", c.utilitiesIncluded);
  set("pets", c.pets);
  set("parking", c.parking);
  set("balcony", c.balcony);
  set("washer", c.washer);
  set("campus", c.campusSlug);
  set("walk", c.maxWalkMinutes);
  set("q", c.q);
  if (c.sort !== "newest") set("sort", c.sort);
  if (c.page > 1) set("page", c.page);

  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === "") p.delete(k);
    else p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

const ORDER_BY: Record<Sort, Prisma.ListingOrderByWithRelationInput[]> = {
  newest: [{ firstPublishedAt: "desc" }, { createdAt: "desc" }],
  price_asc: [{ priceEurCents: "asc" }],
  upfront_asc: [{ upfrontEurCents: "asc" }],
  price_desc: [{ priceEurCents: "desc" }],
  size_desc: [{ sizeM2: "desc" }],
};

function buildWhere(c: SearchCriteria): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    direction: c.direction,
    // Matches the partial indexes: listing_live_idx / listing_live_area_idx.
    status: "ACTIVE",
    moderationState: "APPROVED",
    city: { slug: "tirana" },
  };

  if (c.propertyKind) where.propertyKind = c.propertyKind;
  if (c.layout) where.layout = c.layout;
  if (c.furnished) where.furnished = c.furnished;
  if (c.bathroom) where.bathroom = c.bathroom;
  if (c.utilitiesIncluded) where.utilitiesIncluded = true;
  if (c.noAgencyFee) where.agencyFee = false;
  if (c.pets) where.petsAllowed = true;
  if (c.parking) where.parking = true;
  if (c.balcony) where.balcony = true;
  if (c.washer) where.washingMachine = true;

  // Gender preference is meaningful only on rooms, and is stored as a preference,
  // never a hard gate — ANY listings always remain visible.
  if (c.gender && c.gender !== "ANY") {
    where.OR = [{ wantedGender: c.gender }, { wantedGender: "ANY" }, { wantedGender: null }];
  }

  if (c.areaSlug) {
    // WANTED rows express zones through areaPrefs; OFFER rows through areaId.
    where[c.direction === "WANTED" ? "areaPrefs" : "area"] =
      c.direction === "WANTED"
        ? { some: { area: { slug: c.areaSlug } } }
        : { slug: c.areaSlug };
  }

  if (c.minEur !== undefined || c.maxEur !== undefined) {
    where.priceEurCents = {
      ...(c.minEur !== undefined ? { gte: Math.round(c.minEur * 100) } : {}),
      ...(c.maxEur !== undefined ? { lte: Math.round(c.maxEur * 100) } : {}),
    };
  }

  if (c.availableFrom) where.availableFrom = { lte: c.availableFrom };

  if (c.q) {
    // Stage 1 free text. pg_trgm indexes exist for the stage-2 upgrade; `mode:
    // "insensitive"` will not use them, which is fine at this corpus size.
    where.AND = [
      {
        OR: [
          { title: { contains: c.q, mode: "insensitive" } },
          { description: { contains: c.q, mode: "insensitive" } },
          { area: { name: { contains: c.q, mode: "insensitive" } } },
          { area: { aliases: { hasSome: [c.q] } } },
        ],
      },
    ];
  }

  // Campus proximity as a bounding box. Cheap, index-friendly, and refined below.
  const campus = c.campusSlug ? CAMPUSES.find((x) => x.slug === c.campusSlug) : undefined;
  if (campus && c.maxWalkMinutes) {
    const km = (c.maxWalkMinutes / 60) * 4.5 / 1.3;
    const dLat = km / 111;
    const dLng = km / (111 * Math.cos((campus.lat * Math.PI) / 180));
    where.lat = { gte: campus.lat - dLat, lte: campus.lat + dLat };
    where.lng = { gte: campus.lng - dLng, lte: campus.lng + dLng };
  }

  return where;
}

export const LISTING_CARD_SELECT = {
  id: true,
  title: true,
  propertyKind: true,
  layout: true,
  priceAmountCents: true,
  priceCurrency: true,
  priceEurCents: true,
  upfrontEurCents: true,
  utilitiesIncluded: true,
  utilitiesEurCents: true,
  depositMonths: true,
  agencyFee: true,
  sizeM2: true,
  roomSizeM2: true,
  bathroom: true,
  furnished: true,
  availableFrom: true,
  availableTo: true,
  flatmatesTotal: true,
  wantedGender: true,
  lat: true,
  lng: true,
  status: true,
  createdAt: true,
  area: { select: { slug: true, name: true, lat: true, lng: true } },
  media: { select: { url: true }, orderBy: { sort: "asc" }, take: 1 },
  owner: { select: { displayName: true, phoneVerifiedAt: true } },
  translations: { select: { locale: true, title: true } },
} satisfies Prisma.ListingSelect;

export type ListingCardData = Prisma.ListingGetPayload<{
  select: typeof LISTING_CARD_SELECT;
}>;

export type SearchResult = {
  items: ListingCardData[];
  total: number;
  page: number;
  pageCount: number;
};

export async function searchListings(c: SearchCriteria): Promise<SearchResult> {
  const where = buildWhere(c);

  const [total, rows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      select: LISTING_CARD_SELECT,
      orderBy: ORDER_BY[c.sort],
      skip: (c.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // Refine the bounding box to a true radius. Done in application code because the
  // over-fetch is small and this avoids a PostGIS dependency for one feature.
  let items = rows;
  const campus = c.campusSlug ? CAMPUSES.find((x) => x.slug === c.campusSlug) : undefined;
  if (campus && c.maxWalkMinutes) {
    const maxKm = ((c.maxWalkMinutes / 60) * 4.5) / 1.3;
    items = rows.filter((r) =>
      r.lat != null && r.lng != null
        ? distanceKm({ lat: r.lat, lng: r.lng }, campus) <= maxKm
        : false,
    );
  }

  return {
    items,
    total,
    page: c.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Zone list with live counts, for the filter sidebar. */
export async function areasWithCounts(direction: Direction = "OFFER") {
  const areas = await prisma.area.findMany({
    where: { city: { slug: "tirana" } },
    select: {
      slug: true,
      name: true,
      aliases: true,
      _count: {
        select: {
          listings: {
            where: { direction, status: "ACTIVE", moderationState: "APPROVED" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return areas.map((a) => ({
    slug: a.slug,
    name: a.name,
    aliases: a.aliases,
    count: a._count.listings,
  }));
}

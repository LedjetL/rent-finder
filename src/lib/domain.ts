import { Currency, Layout } from "@/generated/prisma/enums";

/**
 * Domain vocabulary and money rules.
 *
 * Enums live in the Prisma schema and are re-exported here so application code has
 * one import site. What this file adds on top is the Albanian-specific presentation
 * and the arithmetic that makes the site's central promise legible.
 */

// Re-exported so application code has a single import site for domain vocabulary.
export {
  BathroomType,
  Currency,
  Direction,
  Furnished,
  GenderPref,
  Heating,
  Layout,
  ListingStatus,
  ModerationState,
  PropertyKind,
  ReportReason,
} from "@/generated/prisma/enums";

export const LANGS = ["sq", "en"] as const;
export type Lang = (typeof LANGS)[number];

/**
 * Albanian flats are described as bedrooms + living room: a "2+1" is two bedrooms
 * plus a living room. We keep the local notation everywhere — "2 bedroom" reads
 * foreign and silently loses the living room.
 */
export const LAYOUT_LABEL: Record<Layout, string> = {
  GARSONIERE: "Garsoniere",
  ONE_PLUS_ONE: "1+1",
  TWO_PLUS_ONE: "2+1",
  THREE_PLUS_ONE: "3+1",
  FOUR_PLUS_ONE: "4+1",
};

/** Bedroom count implied by a layout — used only for sorting and filtering. */
export const LAYOUT_ROOMS: Record<Layout, number> = {
  GARSONIERE: 0,
  ONE_PLUS_ONE: 1,
  TWO_PLUS_ONE: 2,
  THREE_PLUS_ONE: 3,
  FOUR_PLUS_ONE: 4,
};

export const LAYOUT_ORDER: Layout[] = [
  "GARSONIERE",
  "ONE_PLUS_ONE",
  "TWO_PLUS_ONE",
  "THREE_PLUS_ONE",
  "FOUR_PLUS_ONE",
];

// ───────────────────────────────────────────────────────────── money ──

/**
 * Lek per Euro, scaled by 10_000 to stay in integers. Rent is negotiated in EUR but
 * budgeted in Lek, so both are shown. Seeded into FxRate; this is the fallback.
 */
export const ALL_PER_EUR_SCALED = 98_0000;
const SCALE = 10_000;

export function eurCentsToAllCents(eurCents: number): number {
  return Math.round((eurCents * ALL_PER_EUR_SCALED) / SCALE);
}

export function allCentsToEurCents(allCents: number): number {
  return Math.round((allCents * SCALE) / ALL_PER_EUR_SCALED);
}

/** Normalise whatever the lister typed into the one column every query uses. */
export function toEurCents(amountCents: number, currency: Currency): number {
  return currency === "EUR" ? amountCents : allCentsToEurCents(amountCents);
}

export function formatMoney(cents: number, currency: Currency, lang: Lang): string {
  const locale = lang === "sq" ? "sq-AL" : "en-GB";
  if (currency === "EUR") {
    return `€${Math.round(cents / 100).toLocaleString(locale)}`;
  }
  // Lek is quoted in whole hundreds; false precision would imply a fixed rate.
  const lek = Math.round(cents / 100 / 100) * 100;
  return `${lek.toLocaleString(locale)} L`;
}

/** The secondary price line: what this costs in the other currency. */
export function formatAlternate(
  eurCents: number,
  currency: Currency,
  lang: Lang,
): string {
  return currency === "EUR"
    ? formatMoney(eurCentsToAllCents(eurCents), "ALL", lang)
    : formatMoney(eurCents, "EUR", lang);
}

/**
 * The true cost of signing — and the whole reason this site exists.
 *
 * Tirana listings quote rent only, then add a deposit and often a broker commission
 * at signing. That gap is the single most common unpleasant surprise for renters, so
 * we compute it and show it on every card rather than burying it in the description.
 */
export function moveInCostEurCents(listing: {
  priceEurCents: number;
  depositMonths: number;
  agencyFee: boolean;
}): number {
  const deposit = listing.priceEurCents * listing.depositMonths;
  // Tenant-side commission in Albania is customarily half a month's rent.
  const commission = listing.agencyFee ? Math.round(listing.priceEurCents / 2) : 0;
  return listing.priceEurCents + deposit + commission;
}

/** What a seeker saves versus the same place found through an agency. */
export function agencySavingEurCents(priceEurCents: number): number {
  return Math.round(priceEurCents / 2);
}

// ─────────────────────────────────────────────────────────── sorting ──

export const SORTS = [
  "newest",
  "price_asc",
  // Sorting by cash-at-signing rather than rent is the sort this site exists to
  // offer: a cheap room with a two-month deposit and a commission can cost more
  // to move into than a dearer one with neither.
  "upfront_asc",
  "price_desc",
  "size_desc",
] as const;
export type Sort = (typeof SORTS)[number];

export function isOneOf<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

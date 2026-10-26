import "server-only";
import { prisma } from "./db";
import type { PropertyKind } from "@/generated/prisma/enums";

/**
 * The rent index.
 *
 * Powers "A po paguan shumë?" — the check that tells someone whether their own
 * rent is above or below what the rest of Tirana pays for the same thing.
 *
 * Two rules make it honest rather than merely convincing:
 *
 *  1. Every answer carries its sample size. A comparison drawn from four listings
 *     is a guess, and saying so is what separates this from the confident nonsense
 *     already on the internet.
 *  2. Below MIN_ZONE_SAMPLE it falls back to a city-wide comparison and says it has
 *     done so, rather than quietly pretending a thin slice is a market.
 */

/** Below this many comparable listings, a zone number is not worth quoting. */
export const MIN_ZONE_SAMPLE = 6;

export type RentVerdict = {
  /** What the person told us they pay, in EUR cents. */
  yours: number;
  count: number;
  median: number;
  p25: number;
  p75: number;
  /** Whiskers for the plotted range. */
  low: number;
  high: number;
  /** Signed share above (+) or below (−) the median, e.g. 0.23 for 23% over. */
  delta: number;
  /** True when the zone was too thin and we compared against all of Tirana. */
  cityWide: boolean;
  zoneName: string;
  /** How many live listings sit below what they pay — the reason to keep reading. */
  cheaperCount: number;
};

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

export async function compareRent(input: {
  areaSlug: string;
  propertyKind: PropertyKind;
  yoursEurCents: number;
}): Promise<RentVerdict | null> {
  const [area, rows] = await Promise.all([
    prisma.area.findFirst({
      where: { slug: input.areaSlug, city: { slug: "tirana" } },
      select: { name: true },
    }),
    prisma.listing.findMany({
      where: {
        direction: "OFFER",
        propertyKind: input.propertyKind,
        status: "ACTIVE",
        moderationState: "APPROVED",
        city: { slug: "tirana" },
      },
      select: { priceEurCents: true, area: { select: { slug: true } } },
    }),
  ]);

  if (!area || rows.length === 0) return null;

  const inZone = rows
    .filter((r) => r.area?.slug === input.areaSlug)
    .map((r) => r.priceEurCents);

  const cityWide = inZone.length < MIN_ZONE_SAMPLE;
  const sample = (cityWide ? rows.map((r) => r.priceEurCents) : inZone).sort(
    (a, b) => a - b,
  );
  if (sample.length === 0) return null;

  const median = quantile(sample, 0.5);

  return {
    yours: input.yoursEurCents,
    count: sample.length,
    median,
    p25: quantile(sample, 0.25),
    p75: quantile(sample, 0.75),
    low: quantile(sample, 0.05),
    high: quantile(sample, 0.95),
    delta: median > 0 ? (input.yoursEurCents - median) / median : 0,
    cityWide,
    zoneName: area.name,
    cheaperCount: sample.filter((p) => p < input.yoursEurCents).length,
  };
}

/** Zones that actually have enough listings to be worth offering in the picker. */
export async function indexableAreas() {
  const areas = await prisma.area.findMany({
    where: { city: { slug: "tirana" } },
    select: {
      slug: true,
      name: true,
      _count: {
        select: {
          listings: {
            where: { direction: "OFFER", status: "ACTIVE", moderationState: "APPROVED" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return areas.map((a) => ({ slug: a.slug, name: a.name, count: a._count.listings }));
}

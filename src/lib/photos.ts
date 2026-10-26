// Deliberately no `server-only` guard: sharp and node:fs already make this module
// impossible to bundle for the browser, and the guard would block scripts/photo-check.ts
// from exercising the hashing outside Next.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "./db";

/**
 * Photo upload.
 *
 * Two jobs, one pass over the bytes:
 *
 *  1. Make the picture usable. Albanian listings are famously three lines and one
 *     dark photo, so photography is the cheapest lever we have for winning the first
 *     hundred landlords — which means accepting a 6 MB phone JPEG and turning it into
 *     something that loads on mobile data.
 *  2. Fingerprint it. Photos lifted from other portals are one of the main scam
 *     patterns, so every upload gets a perceptual hash and is compared against what
 *     we already hold before the listing goes live.
 *
 * Files land on local disk under public/uploads. That is deliberate for now: it
 * needs no API keys and no bucket, and swapping in object storage later only
 * changes `persist()`.
 */

// Keep next.config.ts's serverActions.bodySizeLimit >= MAX_PHOTOS * MAX_BYTES.
export const MAX_PHOTOS = 8;
export const MAX_BYTES = 12 * 1024 * 1024;

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** Longest edge, in pixels. Enough for a full-width lead image, small enough to load. */
const MAX_EDGE = 1600;

export type StoredPhoto = {
  url: string;
  width: number;
  height: number;
  phash: bigint;
};

/**
 * 64-bit difference hash.
 *
 * Downscale to 9x8 greyscale and record, for each row, whether each pixel is
 * brighter than the one to its right. That makes the hash robust to the things a
 * thief changes — resizing, re-compression, mild brightness shifts — while staying
 * cheap enough to run inline on upload.
 */
async function dHash(input: Buffer): Promise<bigint> {
  // toColourspace("b-w") is what actually collapses the raw buffer to ONE byte per
  // pixel. greyscale() alone still emits three identical channels, which silently
  // makes the row indexing below read the wrong bytes and returns a near-constant
  // hash for every image.
  const { data, info } = await sharp(input)
    .greyscale()
    .toColourspace("b-w")
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const stride = info.channels;

  let hash = 0n;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = data[(row * 9 + col) * stride];
      const right = data[(row * 9 + col + 1) * stride];
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return BigInt.asIntN(64, hash);
}

export function hammingDistance(a: bigint, b: bigint): number {
  let x = BigInt.asUintN(64, a ^ b);
  let bits = 0;
  while (x) {
    x &= x - 1n;
    bits++;
  }
  return bits;
}

/** Distance at or below this means "the same photograph, probably re-encoded". */
export const DUPLICATE_THRESHOLD = 8;

async function persist(listingId: string, index: number, bytes: Buffer) {
  const dir = path.join(process.cwd(), "public", "uploads", listingId);
  await mkdir(dir, { recursive: true });
  const file = `${index}.webp`;
  await writeFile(path.join(dir, file), bytes);
  return `/uploads/${listingId}/${file}`;
}

/**
 * Process one upload. Returns null for anything that is not a usable image rather
 * than throwing, so one bad file in a multi-select does not lose the whole post.
 */
export async function processPhoto(
  listingId: string,
  index: number,
  file: File,
): Promise<StoredPhoto | null> {
  if (!ACCEPTED.has(file.type) || file.size === 0 || file.size > MAX_BYTES) return null;

  const input = Buffer.from(await file.arrayBuffer());

  try {
    // rotate() with no argument applies the EXIF orientation tag, which is why
    // phone photos otherwise arrive sideways.
    const { data, info } = await sharp(input, { failOn: "error" })
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    const [url, phash] = await Promise.all([
      persist(listingId, index, data),
      dHash(input),
    ]);

    return { url, width: info.width, height: info.height, phash };
  } catch {
    // A corrupt or spoofed file loses itself, not the whole submission.
    return null;
  }
}

/**
 * Look for the same photograph already on the site.
 *
 * Compared in application code rather than SQL: Postgres has no native Hamming
 * distance for bigints, and at this corpus size scanning the hashes is far cheaper
 * than adding an extension. If this ever gets slow, the fix is a BK-tree or the
 * `bktree`/`pg_similarity` extension, not a rewrite of the caller.
 */
export async function findDuplicates(
  hashes: bigint[],
  excludeListingId: string,
): Promise<{ listingId: string; distance: number }[]> {
  if (hashes.length === 0) return [];

  const existing = await prisma.media.findMany({
    where: { phash: { not: null }, listingId: { not: excludeListingId } },
    select: { listingId: true, phash: true },
  });

  const hits: { listingId: string; distance: number }[] = [];
  for (const row of existing) {
    if (row.phash === null) continue;
    for (const h of hashes) {
      const d = hammingDistance(h, row.phash);
      if (d <= DUPLICATE_THRESHOLD) {
        hits.push({ listingId: row.listingId, distance: d });
        break;
      }
    }
  }
  return hits;
}

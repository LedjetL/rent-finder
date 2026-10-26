import "dotenv/config";
import { rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { hammingDistance, processPhoto, DUPLICATE_THRESHOLD } from "../src/lib/photos";

/**
 * Checks the photo pipeline end to end without a browser:
 * does a re-encoded, resized copy of a photo still hash close enough to be caught,
 * and does an unrelated photo stay far away?
 *
 * Run: npx tsx scripts/photo-check.ts
 */

const TEST_ID = "__photo-check";

/**
 * dHash is luminance- and structure-based, so two images must differ in LAYOUT to
 * hash differently — varying only the hue would (correctly) produce the same hash.
 * Geometry is therefore derived from the seed, not just colour.
 */
async function makePhoto(seed: number, size = 1400) {
  const w = size;
  const h = Math.round(size * 0.66);
  const r = (n: number) => ((seed * n) % 97) / 97; // deterministic 0..1 per seed

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="${r(13)}" y1="0" x2="${r(29)}" y2="1">
      <stop offset="0%" stop-color="hsl(${(seed * 67) % 360},45%,${60 + r(7) * 30}%)"/>
      <stop offset="100%" stop-color="hsl(${(seed * 131) % 360},35%,${15 + r(11) * 25}%)"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect x="${w * r(3)}" y="${h * r(5)}" width="${w * (0.15 + r(17) * 0.3)}"
          height="${h * (0.2 + r(19) * 0.5)}" fill="hsl(0,0%,${70 + r(23) * 25}%)"/>
    <circle cx="${w * (0.3 + r(31) * 0.6)}" cy="${h * (0.2 + r(37) * 0.6)}"
            r="${h * (0.1 + r(41) * 0.2)}" fill="hsl(0,0%,${5 + r(43) * 25}%)"/>
    <rect x="0" y="${h * (0.6 + r(47) * 0.3)}" width="${w}" height="${h * 0.3}"
          fill="hsl(0,0%,${10 + r(53) * 20}%)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

const asFile = (buf: Buffer, name: string) =>
  new File([new Uint8Array(buf)], name, { type: "image/jpeg" });

async function main() {
  const original = await makePhoto(7);

  // What a thief actually uploads: the same picture, smaller and re-compressed.
  const stolen = await sharp(original)
    .resize(900)
    .jpeg({ quality: 62 })
    .toBuffer();

  // Same picture again, slightly brightened — the other common tweak.
  const brightened = await sharp(original)
    .modulate({ brightness: 1.12 })
    .jpeg({ quality: 80 })
    .toBuffer();

  const unrelated = await makePhoto(42);

  const [a, b, c, d] = await Promise.all([
    processPhoto(TEST_ID, 0, asFile(original, "a.jpg")),
    processPhoto(TEST_ID, 1, asFile(stolen, "b.jpg")),
    processPhoto(TEST_ID, 2, asFile(brightened, "c.jpg")),
    processPhoto(TEST_ID, 3, asFile(unrelated, "d.jpg")),
  ]);

  if (!a || !b || !c || !d) throw new Error("a photo failed to process");

  const rows = [
    ["original vs re-encoded + resized", hammingDistance(a.phash, b.phash), true],
    ["original vs brightened", hammingDistance(a.phash, c.phash), true],
    ["original vs unrelated photo", hammingDistance(a.phash, d.phash), false],
  ] as const;

  console.log(`threshold: <= ${DUPLICATE_THRESHOLD} means "same photo"\n`);
  let failures = 0;
  for (const [label, distance, shouldMatch] of rows) {
    const matched = distance <= DUPLICATE_THRESHOLD;
    const ok = matched === shouldMatch;
    if (!ok) failures++;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${String(distance).padStart(2)} bits  ${label}` +
        `  (${matched ? "flagged" : "allowed"}, expected ${shouldMatch ? "flagged" : "allowed"})`,
    );
  }

  console.log("\nresized output:", `${b.width}x${b.height}`);
  const savedKb = Math.round(Buffer.byteLength(original) / 1024);
  console.log(`input ${savedKb} KB jpeg -> stored webp`);

  await rm(path.join(process.cwd(), "public", "uploads", TEST_ID), {
    recursive: true,
    force: true,
  });

  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

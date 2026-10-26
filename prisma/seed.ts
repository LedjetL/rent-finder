import "dotenv/config";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  Currency,
  Direction,
  GenderPref,
  Layout,
  PropertyKind,
} from "../src/generated/prisma/enums";
import { NEIGHBORHOODS } from "../src/lib/tirana";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Deterministic PRNG so re-seeding produces the same demo data.
let state = 20260903;
const rnd = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (lo: number, hi: number) => Math.floor(rnd() * (hi - lo + 1)) + lo;
const chance = (p: number) => rnd() < p;

const hashPassword = (pw: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
};
const phoneHash = (phone: string) =>
  createHash("sha256").update(phone).digest("hex").slice(0, 32);

const ALL_PER_EUR = 98;

/** Price tiers reflecting the real market: Blloku commands a large premium. */
const TIER: Record<string, number> = {
  blloku: 1.75, qendra: 1.5, "komuna-e-parisit": 1.35, "myslym-shyri": 1.25,
  "pazari-i-ri": 1.25, "tirana-e-re": 1.2, "liqeni-i-thate": 1.2, selita: 1.15,
  "rruga-e-elbasanit": 1.1, "rruga-e-kavajes": 1.05, "zogu-i-zi": 1.05,
  "qyteti-studenti": 1.0, "rruga-e-dibres": 1.0, medreseja: 0.98, porcelan: 0.95,
  "ali-demi": 0.95, "don-bosko": 0.95, "vasil-shanto": 0.92, "21-dhjetori": 0.9,
  astir: 0.9, sauk: 0.9, xhamlliku: 0.88, kinostudio: 0.85, "unaza-e-re": 0.85,
  fresku: 0.82, farke: 0.8, laprake: 0.75, "bregu-i-lumit": 0.72, kombinat: 0.7,
  yzberisht: 0.7, kashar: 0.65, paskuqan: 0.6,
};

const LAYOUT_BASE_EUR: Record<Layout, number> = {
  GARSONIERE: 230, ONE_PLUS_ONE: 320, TWO_PLUS_ONE: 450,
  THREE_PLUS_ONE: 620, FOUR_PLUS_ONE: 780,
};

const AL_NAMES = [
  "Enea Hoxha", "Klara Meta", "Ardit Shehu", "Blerta Kola", "Erion Prifti",
  "Sara Dervishi", "Redi Basha", "Xhoana Leka", "Genti Rama", "Anila Berisha",
  "Denis Çela", "Megi Toska", "Kristi Nika", "Ilda Progni", "Marsel Gjoka",
  "Fjolla Ndreu", "Aleksi Zeqo", "Rea Bardhi", "Ermal Kurti", "Nora Vata",
  "Ledio Sula", "Erisa Malaj", "Gerti Alia", "Ina Dushku",
];
const INTL_NAMES = [
  "Lena Fischer", "Marco Bianchi", "Sophie Dubois", "Tom Whelan",
  "Ana Petrović", "Kaan Yıldız", "Elif Demir", "Nikos Papadakis",
];

const ROOM_TITLES = [
  "Dhomë e ndritshme në apartament 3+1",
  "Dhomë me ballkon, bashkëbanues të qetë",
  "Dhomë e mobiluar, faturat e përfshira",
  "Dhomë në apartament të ri",
  "Dhomë tek studentët, hyrje e menjëhershme",
  "Dhomë e madhe me dritare nga jugu",
];
const UNIT_TITLES = [
  "Apartament i mobiluar, gati për hyrje",
  "Apartament i rinovuar, kat i mesëm",
  "Apartament i ri me ashensor dhe parkim",
  "Apartament i ndritshëm me ballkon të madh",
  "Apartament komod pranë transportit",
];
const SHORT_TITLES = [
  "Qira e përkohshme 3 muaj, plotësisht e mobiluar",
  "Apartament për Erasmus, semestri i dytë",
  "Nënqira gjatë verës, gjithçka e përfshirë",
];

function describe(kind: PropertyKind, hood: string, blurb: string): string {
  const commute = pick([
    "Autobusi te stacioni 2 minuta larg.",
    "Ecën 15 minuta deri në qendër.",
    "Supermarket dhe furrë në të njëjtën rrugë.",
    "Parku është shumë afër, ideal për vrap në mëngjes.",
  ]);
  const cond = pick([
    "Apartamenti është rinovuar vitin e kaluar.",
    "Ndërtesa është e re, me ashensor që punon rregullisht.",
    "Dritaret janë me xham dopio, nuk dëgjohet zhurma e rrugës.",
    "Ka kondicioner në çdo dhomë.",
  ]);
  const social =
    kind === "ROOM"
      ? pick([
          "Jemi njerëz të qetë, punojmë ditën dhe respektojmë hapësirën e njëri-tjetrit.",
          "Gatuajmë shpesh bashkë por askush nuk e ka detyrim.",
          "Kërkojmë dikë të rregullt, jo festa në apartament.",
        ])
      : pick([
          "I përshtatshëm për çift ose dy shokë.",
          "Kontrata bëhet te noteri, gjithçka e rregullt.",
          "Pronari banon jashtë vendit, komunikimi bëhet online.",
        ]);
  return `${hood}: ${blurb} ${commute} ${cond} ${social}`;
}

function describeEn(kind: PropertyKind, hood: string, blurb: string): string {
  const social =
    kind === "ROOM"
      ? "We're quiet, we work during the day and we respect each other's space."
      : "Suitable for a couple or two friends. Proper contract at the notary.";
  return `${hood}: ${blurb} ${social}`;
}

async function main() {
  console.log("Resetting…");
  // Event is append-only, so DELETE is blocked by trigger. TRUNCATE bypasses
  // row-level triggers, which is exactly the dev-reset escape hatch we want.
  await prisma.$executeRawUnsafe('TRUNCATE "Event" CASCADE');
  await prisma.report.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.media.deleteMany();
  await prisma.listingAreaPref.deleteMany();
  await prisma.listingTranslation.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();
  await prisma.fxRate.deleteMany();
  await prisma.city.deleteMany();

  console.log("City + areas…");
  const tirana = await prisma.city.create({
    data: {
      slug: "tirana", name: "Tiranë", countryCode: "AL",
      lat: 41.3275, lng: 19.8187, defaultCurrency: "EUR", isLive: true,
    },
  });
  // Multi-city from the schema up — these exist as rows but never render.
  await prisma.city.createMany({
    data: [
      { slug: "durres", name: "Durrës", lat: 41.3231, lng: 19.4414, isLive: false },
      { slug: "vlore", name: "Vlorë", lat: 40.4661, lng: 19.4897, isLive: false },
      { slug: "shkoder", name: "Shkodër", lat: 42.0693, lng: 19.5033, isLive: false },
    ],
  });

  const areas: Awaited<ReturnType<typeof prisma.area.create>>[] = [];
  for (const n of NEIGHBORHOODS) {
    areas.push(
      await prisma.area.create({
        data: {
          cityId: tirana.id, slug: n.slug, name: n.name, aliases: n.aliases,
          lat: n.lat, lng: n.lng, blurbSq: n.blurbSq, blurbEn: n.blurbEn,
        },
      }),
    );
  }
  console.log(`  ${areas.length} areas`);

  const fx = await prisma.fxRate.create({
    data: { base: "EUR", quote: "ALL", rateScaled: ALL_PER_EUR * 10_000 },
  });

  console.log("Users…");
  const password = hashPassword("password123");
  const users = [];
  const names = [...AL_NAMES, ...INTL_NAMES];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const intl = i >= AL_NAMES.length;
    const phone = `+3556${int(80, 99)}${int(100000, 999999)}`;
    users.push(
      await prisma.user.create({
        data: {
          phoneE164: phone,
          phoneHash: phoneHash(phone),
          phoneVerifiedAt: chance(0.8) ? new Date() : null,
          email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.al`,
          passwordHash: password,
          displayName: name,
          locale: intl ? "en" : "sq",
          birthYear: int(1988, 2005),
          languages: intl ? "en,sq" : chance(0.7) ? "sq,en" : "sq",
          bio: intl
            ? "Moved to Tirana for work, still learning Albanian."
            : "Banoj në Tiranë prej vitesh, i qetë dhe i rregullt.",
        },
      }),
    );
  }

  const demoPhone = "+355691234567";
  const demo = await prisma.user.create({
    data: {
      phoneE164: demoPhone, phoneHash: phoneHash(demoPhone),
      phoneVerifiedAt: new Date(), email: "demo@rentfinder.al",
      passwordHash: password, displayName: "Demo User", locale: "sq",
      birthYear: 1996, languages: "sq,en",
      bio: "Llogari demo për të provuar faqen.",
    },
  });
  users.push(demo);
  await prisma.verification.createMany({
    data: [
      { userId: demo.id, kind: "PHONE", state: "VERIFIED", verifiedAt: new Date() },
      { userId: demo.id, kind: "MET_IN_PERSON", state: "VERIFIED", verifiedAt: new Date() },
    ],
  });

  console.log("Listings (OFFER)…");
  let offers = 0;
  for (const area of areas) {
    const tier = TIER[area.slug] ?? 1;

    for (let i = 0; i < int(2, 4); i++) {
      // The product is people sharing the place they already live in, so rooms
      // dominate. Whole units and short lets exist but are the minority.
      const propertyKind = pick<PropertyKind>([
        "ROOM", "ROOM", "ROOM", "ROOM", "ROOM", "ROOM", "ROOM",
        "WHOLE_UNIT", "WHOLE_UNIT", "SHORT_TERM",
      ]);
      const layout =
        propertyKind === "ROOM"
          ? pick<Layout>(["TWO_PLUS_ONE", "THREE_PLUS_ONE", "THREE_PLUS_ONE", "FOUR_PLUS_ONE"])
          : pick<Layout>(["GARSONIERE", "ONE_PLUS_ONE", "ONE_PLUS_ONE", "TWO_PLUS_ONE", "THREE_PLUS_ONE"]);

      // A room costs a fraction of the whole flat, not the flat price.
      const base = LAYOUT_BASE_EUR[layout] * tier;
      const eur =
        propertyKind === "ROOM"
          ? Math.round((base * (0.32 + rnd() * 0.12)) / 5) * 5
          : Math.round((base * (0.85 + rnd() * 0.35)) / 10) * 10;
      const priceEurCents = eur * 100;

      // Roughly a fifth of listers quote in Lek — exercise the multi-currency path.
      const inLek = chance(0.2);
      const priceCurrency: Currency = inLek ? "ALL" : "EUR";
      const priceAmountCents = inLek
        ? Math.round((eur * ALL_PER_EUR) / 100) * 100 * 100
        : priceEurCents;

      const owner = pick(users);
      const utilitiesIncluded = chance(0.35);
      const sizeM2 =
        layout === "GARSONIERE" ? int(28, 42)
        : layout === "ONE_PLUS_ONE" ? int(45, 65)
        : layout === "TWO_PLUS_ONE" ? int(65, 95)
        : layout === "THREE_PLUS_ONE" ? int(95, 130)
        : int(130, 170);

      const title =
        propertyKind === "ROOM" ? pick(ROOM_TITLES)
        : propertyKind === "SHORT_TERM" ? pick(SHORT_TITLES)
        : pick(UNIT_TITLES);

      // A deposit is standard when a landlord lets a whole flat. It is much less
      // universal when someone sublets the spare room in the flat they live in —
      // that arrangement is informal, and plenty of room shares ask for nothing.
      const depositMonths =
        propertyKind === "ROOM"
          ? pick([0, 0, 0, 1, 1])
          : pick([1, 1, 1, 2]);
      // An agent does not broker somebody's spare room — the commission on a €150
      // room is not worth their time, which is exactly why this segment is open.
      // So a fee only ever appears on a whole unit, and even there it is a minority.
      const agencyFee = propertyKind === "WHOLE_UNIT" && chance(0.35);
      const availableFrom = new Date(Date.now() + int(-20, 75) * 86400000);
      const temporary = propertyKind === "SHORT_TERM" || chance(0.12);
      const isRoom = propertyKind === "ROOM";
      const published = new Date(Date.now() - int(0, 45) * 86400000);
      const status = chance(0.06) ? "TAKEN" : "ACTIVE";

      const listing = await prisma.listing.create({
        data: {
          cityId: tirana.id,
          areaId: area.id,
          ownerId: owner.id,
          ownerPhoneHash: owner.phoneHash,
          direction: "OFFER" satisfies Direction,
          propertyKind,
          layout,
          title: `${title} — ${area.name}`,
          description: describe(propertyKind, area.name, area.blurbSq ?? ""),
          addressHint: chance(0.7)
            ? `Pranë ${pick(["shkollës", "supermarketit", "farmacisë", "stacionit të autobusit", "parkut"])}`
            : null,
          lat: area.lat + (rnd() - 0.5) * 0.008,
          lng: area.lng + (rnd() - 0.5) * 0.011,
          priceAmountCents,
          priceCurrency,
          priceEurCents,
          upfrontEurCents:
            priceEurCents +
            priceEurCents * depositMonths +
            (agencyFee ? Math.round(priceEurCents / 2) : 0),
          fxRateId: inLek ? fx.id : null,
          utilitiesIncluded,
          utilitiesEurCents: utilitiesIncluded ? null : int(25, 60) * 100,
          depositMonths,
          agencyFee,
          sizeM2,
          roomSizeM2: isRoom ? int(10, 20) : null,
          floor: int(0, 9),
          hasElevator: chance(0.55),
          furnished: pick(["FULL", "FULL", "FULL", "PARTIAL", "NONE"]),
          heating: pick(["AC", "AC", "AC", "CENTRAL", "ELECTRIC", "WOOD"]),
          bathroom: isRoom ? pick(["SHARED", "SHARED", "PRIVATE"]) : "PRIVATE",
          balcony: chance(0.7),
          parking: chance(0.35),
          internet: chance(0.85),
          washingMachine: chance(0.75),
          petsAllowed: chance(0.25),
          smokingAllowed: chance(0.3),
          availableFrom,
          availableTo: temporary
            ? new Date(availableFrom.getTime() + int(90, 300) * 86400000)
            : null,
          minStayMonths: temporary ? int(2, 4) : pick([6, 12, 12]),
          flatmatesTotal: isRoom ? int(1, 3) : null,
          flatmatesGender: isRoom ? pick<GenderPref>(["MIXED", "MIXED", "FEMALE", "MALE"]) : null,
          // CHECK constraint: only ever set on ROOM listings.
          wantedGender: isRoom ? pick<GenderPref>(["ANY", "ANY", "FEMALE", "MALE"]) : null,
          ageMin: isRoom ? int(18, 24) : null,
          ageMax: isRoom ? int(28, 40) : null,
          occupationPref: isRoom ? pick(["Student", "Punonjës", null, null]) : null,
          status,
          moderationState: "APPROVED",
          viewCount: int(3, 480),
          contactCount: int(0, 22),
          firstPublishedAt: published,
          createdAt: published,
        },
      });

      await prisma.listingTranslation.createMany({
        data: [
          {
            listingId: listing.id, locale: "sq",
            title: listing.title, description: listing.description, source: "human",
          },
          {
            listingId: listing.id, locale: "en",
            title: `${propertyKind === "ROOM" ? "Room" : "Apartment"} in ${area.name}`,
            description: describeEn(propertyKind, area.name, area.blurbEn ?? ""),
            source: "machine",
          },
        ],
      });

      await prisma.media.createMany({
        data: Array.from({ length: int(2, 5) }, (_, k) => ({
          listingId: listing.id,
          url: `/api/placeholder/${listing.id}-${k}`,
          sort: k,
          width: 1200,
          height: 800,
        })),
      });

      await prisma.event.create({
        data: {
          verb: "LISTING_PUBLISHED", subjectType: "Listing", subjectId: listing.id,
          actorUserId: owner.id, occurredAt: published,
          metadata: { area: area.slug, priceEurCents },
        },
      });

      offers++;
    }
  }
  console.log(`  ${offers} offers`);

  console.log("Listings (WANTED — the seeker side)…");
  const seekerHeadlines = [
    "Student kërkon dhomë pranë universitetit",
    "Punonjës IT, i qetë, kërkoj 1+1",
    "Erasmus student looking for a room from October",
    "Çift i ri kërkon apartament 2+1",
    "Kërkoj dhomë me qira afatgjatë, jo festa",
    "Infermiere kërkon dhomë afër spitalit",
  ];
  const seekerBodies = [
    "Jam i rregullt me pagesat, nuk pi duhan dhe nuk bëj zhurmë. Punoj nga zyra, ditën nuk jam në shtëpi.",
    "I'm moving to Tirana for six months of remote work. Quiet, tidy, happy to sign a proper contract.",
    "Studioj në Universitetin e Tiranës, kërkoj një dhomë me bashkëbanues të qetë deri në qershor.",
  ];

  let wanted = 0;
  for (const user of users.slice(0, 18)) {
    const propertyKind = pick<PropertyKind>(["ROOM", "ROOM", "WHOLE_UNIT", "SHORT_TERM"]);
    const budgetEur = int(150, 550);
    const prefs = [...new Set(Array.from({ length: int(1, 3) }, () => pick(areas).id))];

    const listing = await prisma.listing.create({
      data: {
        cityId: tirana.id,
        // WANTED rows carry no areaId — they use areaPrefs. Enforced by CHECK.
        areaId: null,
        ownerId: user.id,
        ownerPhoneHash: user.phoneHash,
        direction: "WANTED" satisfies Direction,
        propertyKind,
        layout: propertyKind === "WHOLE_UNIT" ? pick<Layout>(["ONE_PLUS_ONE", "TWO_PLUS_ONE"]) : null,
        title: pick(seekerHeadlines),
        description: pick(seekerBodies),
        priceAmountCents: budgetEur * 100,
        priceCurrency: "EUR",
        priceEurCents: budgetEur * 100,
        availableFrom: new Date(Date.now() + int(5, 90) * 86400000),
        minStayMonths: pick([3, 6, 12, 12, 24]),
        occupationPref: pick(["Student, UT", "Software developer", "Infermiere", "Erasmus, POLIS", "Freelance designer"]),
        petsAllowed: chance(0.2),
        smokingAllowed: chance(0.25),
        status: "ACTIVE",
        moderationState: "APPROVED",
        firstPublishedAt: new Date(),
        areaPrefs: { create: prefs.map((areaId) => ({ areaId })) },
      },
    });

    await prisma.event.create({
      data: {
        verb: "SEEKER_PROFILE_PUBLISHED", subjectType: "Listing",
        subjectId: listing.id, actorUserId: user.id,
      },
    });
    wanted++;
  }
  console.log(`  ${wanted} seeker profiles`);

  console.log("Sample funnel events…");
  const someOffers = await prisma.listing.findMany({
    where: { direction: "OFFER", status: "ACTIVE" }, take: 12,
  });
  for (const l of someOffers) {
    await prisma.event.create({
      data: {
        verb: "CONTACT_REVEALED", subjectType: "Listing", subjectId: l.id,
        actorUserId: demo.id, metadata: { via: "whatsapp" },
      },
    });
  }
  await prisma.favorite.createMany({
    data: someOffers.slice(0, 5).map((l) => ({ userId: demo.id, listingId: l.id })),
  });

  const counts = {
    cities: await prisma.city.count(),
    areas: await prisma.area.count(),
    users: await prisma.user.count(),
    offers: await prisma.listing.count({ where: { direction: "OFFER" } }),
    wanted: await prisma.listing.count({ where: { direction: "WANTED" } }),
    events: await prisma.event.count(),
  };
  console.log("\n", counts);
  console.log("\nLog in with demo@rentfinder.al / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

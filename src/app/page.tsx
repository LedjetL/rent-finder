import Link from "next/link";
import { getT } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { LISTING_CARD_SELECT, areasWithCounts } from "@/lib/search";
import { ListingRow } from "@/components/listing-row";
import { formatMoney } from "@/lib/domain";

export default async function HomePage() {
  const { lang, t } = await getT();

  const [latest, areas, roomStats] = await Promise.all([
    prisma.listing.findMany({
      where: {
        direction: "OFFER",
        status: "ACTIVE",
        moderationState: "APPROVED",
        city: { slug: "tirana" },
      },
      select: LISTING_CARD_SELECT,
      orderBy: [{ firstPublishedAt: "desc" }],
      take: 4,
    }),
    areasWithCounts("OFFER"),
    prisma.listing.aggregate({
      where: {
        direction: "OFFER",
        propertyKind: "ROOM",
        status: "ACTIVE",
        moderationState: "APPROVED",
      },
      _avg: { priceEurCents: true, upfrontEurCents: true },
      _count: true,
    }),
  ]);

  const topAreas = [...areas].sort((a, b) => b.count - a.count).slice(0, 12);
  const avgRent = Math.round(roomStats._avg.priceEurCents ?? 0);
  const avgUpfront = Math.round(roomStats._avg.upfrontEurCents ?? 0);
  const [lead, ...rest] = latest;

  return (
    <div>
      <section className="border-b border-rule pb-5 pt-[26px]">
        <h1 className="display m-0 max-w-[16em] text-[clamp(30px,7vw,58px)]">
          {t("heroTitle")}
        </h1>
        <p className="m-0 mt-3.5 max-w-[44ch] text-[15px] text-ink-mid">{t("heroSubtitle")}</p>
      </section>

      <form action="/listings" method="get" className="border-b border-rule py-[18px]">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-0 flex-[1_1_240px]">
            <label className="field-label" htmlFor="q">
              {t("fArea")}
            </label>
            <input
              id="q"
              name="q"
              placeholder={t("heroSearchPlaceholder")}
              className="field !py-[11px] text-[15px]"
            />
          </div>
          <button type="submit" className="btn-primary flex-none">
            {t("heroCta")}
          </button>
        </div>
      </form>

      {/* The hook, given the weight it deserves: it works with no listings, it is
          useful to people who are not moving today, and it feeds the funnel. */}
      <section className="border-b-2 border-rule py-7">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="min-w-0 flex-[1_1_380px]">
            <p className="label">{lang === "sq" ? "Falas · 10 sekonda" : "Free · 10 seconds"}</p>
            <h2 className="display m-0 mt-3 max-w-[11em] text-[clamp(30px,6.5vw,60px)]">
              {t("checkTitle")}
            </h2>
            <p className="m-0 mt-3 max-w-[42ch] text-[15px] text-ink-mid">{t("checkSub")}</p>
          </div>
          <Link
            href="/kontrollo"
            className="border-2 border-ink bg-[var(--accent)] px-8 py-5 text-[17px] font-bold uppercase tracking-[0.04em] text-[var(--on-accent)] no-underline hover:bg-ink hover:text-plaster"
          >
            {t("checkCta")} →
          </Link>
        </div>
      </section>

      {/* The site's argument, stated as two figures rather than a feature grid. */}
      {roomStats._count > 0 && (
        <section className="flex flex-wrap gap-x-12 gap-y-4 border-b border-rule py-5">
          <div>
            <p className="label m-0">{lang === "sq" ? "Dhoma të lira" : "Rooms available"}</p>
            <p className="figure m-0 mt-1 text-[25px] leading-none">{roomStats._count}</p>
          </div>
          <div>
            <p className="label m-0">
              {lang === "sq" ? "Qiraja mesatare" : "Median rent"}
            </p>
            <p className="figure m-0 mt-1 text-[25px] leading-none">
              {formatMoney(avgRent, "EUR", lang)}
              <span className="font-sans text-[12px] text-ink-mute">{t("perMonth")}</span>
            </p>
          </div>
          <div>
            <p className="label m-0">{t("upfront")}</p>
            <p className="figure m-0 mt-1 text-[25px] leading-none text-cobalt">
              {formatMoney(avgUpfront, "EUR", lang)}
            </p>
          </div>
          <p className="m-0 max-w-[46ch] flex-[1_1_280px] self-end text-[12px] leading-[1.55] text-ink-mute">
            {t("costNote")}
          </p>
        </section>
      )}

      <section className="border-b border-rule py-5">
        <h2 className="label m-0 mb-3">{t("browseByArea")}</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {topAreas.map((a) => (
            <Link
              key={a.slug}
              href={`/listings?area=${a.slug}`}
              className="text-[14px] text-ink no-underline hover:text-cobalt"
            >
              {a.name} <span className="figure text-[11px] text-ink-mute">{a.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <div className="mb-3.5 flex items-baseline justify-between gap-4">
          <h2 className="label m-0">{t("latestListings")}</h2>
          <Link href="/listings" className="text-[13px] text-ink no-underline">
            {t("seeAll")} →
          </Link>
        </div>
        {lead && <ListingRow listing={lead} lang={lang} t={t} variant="lead" />}
        {rest.map((l) => (
          <ListingRow key={l.id} listing={l} lang={lang} t={t} />
        ))}
      </section>
    </div>
  );
}

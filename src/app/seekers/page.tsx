import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, formatDate, propertyKindLabel } from "@/lib/i18n";
import { LAYOUT_LABEL, formatMoney } from "@/lib/domain";

export const metadata: Metadata = { title: "Kërkues" };

/**
 * The seeker side.
 *
 * These rows are Listings with direction = WANTED — the same table, index and
 * moderation queue as the offers. That is the whole point of the polymorphic model:
 * this page needed no second system, and it is the content that keeps the site alive
 * in the ten months a year when supply is thin.
 */
export default async function SeekersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const { lang, t } = await getT();
  const areaFilter = typeof raw.area === "string" ? raw.area : undefined;

  const seekers = await prisma.listing.findMany({
    where: {
      direction: "WANTED",
      status: "ACTIVE",
      moderationState: "APPROVED",
      city: { slug: "tirana" },
      ...(areaFilter ? { areaPrefs: { some: { area: { slug: areaFilter } } } } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      propertyKind: true,
      layout: true,
      priceEurCents: true,
      availableFrom: true,
      minStayMonths: true,
      occupationPref: true,
      petsAllowed: true,
      smokingAllowed: true,
      createdAt: true,
      owner: {
        select: { displayName: true, birthYear: true, languages: true, phoneVerifiedAt: true },
      },
      areaPrefs: { select: { area: { select: { slug: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  const thisYear = new Date().getFullYear();

  return (
    <div className="pt-[26px]">
      <header className="border-b border-rule pb-5">
        <h1 className="display m-0 max-w-[16em] text-[clamp(30px,6vw,48px)]">
          {t("seekersTitle")}
        </h1>
        <p className="m-0 mt-3.5 max-w-[52ch] text-[15px] text-ink-mid">
          {t("seekersSubtitle")}
        </p>
        <p className="m-0 mt-4">
          <Link
            href="/seekers/new"
            className="inline-block bg-cobalt px-[18px] py-3 text-[14px] font-semibold text-on-cobalt no-underline hover:bg-cobalt-deep"
          >
            {t("createSeekerProfile")}
          </Link>
        </p>
      </header>

      {seekers.length === 0 ? (
        <p className="border-t-2 border-ink py-16 text-center text-[14px] text-ink-mute">
          {t("noResults")}
        </p>
      ) : (
        <div>
          {seekers.map((s, i) => (
            <article
              key={s.id}
              className={
                i === 0
                  ? "border-t-2 border-ink pt-3.5"
                  : "mt-[26px] border-t border-rule pt-3.5"
              }
            >
              <div className="flex flex-wrap gap-x-11 gap-y-3">
                <div className="min-w-0 flex-[1_1_380px]">
                  <p className="label m-0 mb-1.5 text-cobalt">
                    {propertyKindLabel(lang, s.propertyKind)}
                    {s.layout ? ` · ${LAYOUT_LABEL[s.layout]}` : ""}
                  </p>
                  <h2 className="display m-0 text-[clamp(20px,2.6vw,27px)] leading-[1.1]">
                    {s.title}
                  </h2>
                  <p className="m-0 mt-2 max-w-[62ch] text-[14px] leading-[1.6] text-ink-mid">
                    {s.description}
                  </p>
                  <p className="m-0 mt-2.5 text-[13px] text-ink-mute">
                    {s.owner.displayName}
                    {s.owner.birthYear ? ` · ${thisYear - s.owner.birthYear}` : ""}
                    {s.occupationPref ? ` · ${s.occupationPref}` : ""}
                  </p>
                  {s.owner.phoneVerifiedAt && (
                    <p className="m-0 mt-2 border-l-2 border-rule pl-2.5 text-[11px] uppercase tracking-[0.1em] text-ink-mid">
                      {t("phoneVerified")}
                    </p>
                  )}
                </div>

                <div className="min-w-[180px] flex-[0_1_260px] border-t border-rule pt-2.5">
                  <p className="label m-0">{t("seekerBudgetUpTo")}</p>
                  <p className="figure m-0 mt-1 text-[25px] leading-none text-cobalt">
                    {formatMoney(s.priceEurCents, "EUR", lang)}
                    <span className="font-sans text-[12px] text-ink-mute">{t("perMonth")}</span>
                  </p>

                  <dl className="m-0 mt-3 text-[13px]">
                    <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                      <dt className="text-ink-mute">{t("seekerMoveIn")}</dt>
                      <dd className="figure m-0">{formatDate(s.availableFrom, lang)}</dd>
                    </div>
                    {s.minStayMonths && (
                      <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                        <dt className="text-ink-mute">{t("seekerStay")}</dt>
                        <dd className="figure m-0">
                          {s.minStayMonths} {t("months")}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <p className="m-0 mt-2.5 text-[12px] leading-[1.5] text-ink-mute">
                    <span className="text-ink-mid">{t("seekerAreas")}: </span>
                    {s.areaPrefs.length > 0
                      ? s.areaPrefs.map((p) => p.area.name).join(", ")
                      : t("noZonePref")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

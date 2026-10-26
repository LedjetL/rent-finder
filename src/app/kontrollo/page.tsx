import Link from "next/link";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { formatMoney } from "@/lib/domain";
import { compareRent, indexableAreas } from "@/lib/rent-index";
import { RentMeter } from "@/components/rent-meter";
import type { PropertyKind } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "A po paguan shumë?",
  description:
    "Shkruaj sa paguan qira në Tiranë dhe shiko ku bie krahasuar me pjesën tjetër të qytetit.",
};

const KINDS: PropertyKind[] = ["ROOM", "WHOLE_UNIT", "SHORT_TERM"];

/**
 * "A po paguan shumë?" — the rent check.
 *
 * This is the front door of the site, not a sub-feature. It works with no listings
 * at all, it is useful to the ninety per cent who are not moving today, and it
 * routes the most motivated seeker in Albania — someone who has just learned they
 * are overpaying — into a page of cheaper rooms in their own zone.
 *
 * The result reads as a GET query so it is linkable and shareable, and the layout
 * is built tall and plain so a phone screenshot of it still makes sense.
 */
export default async function RentCheckPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { lang, t } = await getT();

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const areaSlug = one(sp.area) ?? "";
  const kindRaw = one(sp.kind) ?? "ROOM";
  const propertyKind = (KINDS as string[]).includes(kindRaw)
    ? (kindRaw as PropertyKind)
    : "ROOM";
  const rentRaw = Number(one(sp.rent));
  const hasInput = areaSlug !== "" && Number.isFinite(rentRaw) && rentRaw > 0;

  const [areas, verdict] = await Promise.all([
    indexableAreas(),
    hasInput
      ? compareRent({
          areaSlug,
          propertyKind,
          yoursEurCents: Math.round(rentRaw * 100),
        })
      : Promise.resolve(null),
  ]);

  const over = verdict ? verdict.delta > 0.05 : false;
  const under = verdict ? verdict.delta < -0.05 : false;
  const pctText = verdict ? `${Math.abs(Math.round(verdict.delta * 100))}%` : "";
  const gap = verdict ? Math.abs(verdict.yours - verdict.median) : 0;

  const statusColor = over ? "var(--accent)" : under ? "var(--trust)" : "var(--ink)";

  return (
    <div className="pt-[26px]">
      <header className="border-b-2 border-rule pb-6">
        <p className="label">Rent Finder · Tiranë</p>
        <h1 className="display m-0 mt-3 max-w-[13em] text-[clamp(38px,9vw,84px)]">
          {t("checkTitle")}
        </h1>
        <p className="m-0 mt-4 max-w-[46ch] text-[16px] text-ink-mid">{t("checkSub")}</p>
      </header>

      {/* ── the form ── */}
      <form action="/kontrollo" method="get" className="border-b-2 border-rule py-6">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <label className="field-label" htmlFor="area">
              {t("fArea")}
            </label>
            <select id="area" name="area" required defaultValue={areaSlug} className="field">
              <option value="" disabled>
                —
              </option>
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="kind">
              {t("fType")}
            </label>
            <select id="kind" name="kind" defaultValue={propertyKind} className="field">
              <option value="ROOM">{t("fTypeRoom")}</option>
              <option value="WHOLE_UNIT">{t("fTypeApartment")}</option>
              <option value="SHORT_TERM">{t("fTypeSublet")}</option>
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="rent">
              {t("checkYourRent")}
            </label>
            <input
              id="rent"
              name="rent"
              type="number"
              min={1}
              step={5}
              required
              inputMode="numeric"
              placeholder="280"
              defaultValue={hasInput ? String(rentRaw) : ""}
              className="field figure text-[18px]"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-5 min-h-14 w-full text-[16px]">
          {verdict ? t("checkAgain") : t("checkCta")}
        </button>
      </form>

      {/* ── the answer ── */}
      {verdict && (
        <section className="py-8">
          <p className="label" style={{ background: statusColor }}>
            {over ? t("verdictOver") : under ? t("verdictUnder") : t("verdictFair")}
          </p>

          {over || under ? (
            <>
              <p
                className="figure m-0 mt-4 text-[clamp(64px,18vw,150px)] leading-[0.86] tracking-[-0.04em]"
                style={{ color: statusColor }}
              >
                {over ? "+" : "−"}
                {pctText}
              </p>
              <p className="m-0 mt-3 max-w-[24ch] text-[clamp(19px,3.4vw,28px)] leading-[1.25] text-ink">
                <span className="figure" style={{ color: statusColor }}>
                  {formatMoney(gap, "EUR", lang)}
                </span>{" "}
                {over ? t("verdictOverBody") : t("verdictUnderBody")}
              </p>
            </>
          ) : (
            <p className="display m-0 mt-4 max-w-[16em] text-[clamp(30px,6vw,52px)]">
              {t("verdictFairBody")}
            </p>
          )}

          <div className="mt-10 max-w-[560px]">
            <RentMeter v={verdict} lang={lang} t={t} />
          </div>

          <p className="m-0 mt-7 text-[13px] text-ink-mute">
            {t("checkBasedOn")}{" "}
            <span className="figure text-ink">{verdict.count}</span>{" "}
            {t("checkListingsWord")}
            {!verdict.cityWide && ` · ${verdict.zoneName}`}
          </p>
          {verdict.cityWide && (
            <p className="m-0 mt-1.5 max-w-[52ch] border-l-2 border-rule pl-3 text-[13px] text-ink-mid">
              {t("checkCityWide")}
            </p>
          )}
          <p className="m-0 mt-1.5 text-[13px] text-ink-mute">{t("checkThinData")}</p>

          {/* Someone who has just learned they overpay is the most motivated seeker
              on the site. Send them straight to the listings that beat their rent. */}
          {verdict.cheaperCount > 0 && (
            <Link
              href={`/listings?area=${areaSlug}&kind=${propertyKind}&max=${Math.round(verdict.yours / 100)}&sort=upfront_asc`}
              className="mt-8 inline-block border-2 border-ink bg-ink px-7 py-4 text-[16px] font-bold uppercase tracking-[0.04em] text-plaster no-underline hover:bg-transparent hover:text-ink"
            >
              {t("checkSeeCheaper")} · {verdict.cheaperCount} →
            </Link>
          )}
        </section>
      )}

      {!verdict && (
        <section className="border-b border-rule-soft py-8">
          <p className="m-0 max-w-[52ch] text-[15px] text-ink-mid">
            {lang === "sq"
              ? "Ne nuk marrim komision dhe nuk jemi agjenci. Ky numër vjen nga njoftimet reale në faqe."
              : "We take no commission and we're not an agency. This number comes from the real listings on the site."}
          </p>
        </section>
      )}
    </div>
  );
}

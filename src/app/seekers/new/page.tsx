import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { LAYOUT_LABEL, LAYOUT_ORDER } from "@/lib/domain";
import { createListing } from "@/app/actions/listings";

export const metadata: Metadata = { title: "Krijo profilin e kërkuesit" };

/**
 * The "I need a room" form.
 *
 * This posts to the same server action as a listing, because a seeker profile IS
 * a listing with `direction = WANTED`. It is also the content that keeps the site
 * alive in the ten months a year when supply is thin, so it is a first-class page
 * rather than a settings toggle.
 */
export default async function NewSeekerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/seekers/new");

  const { lang, t } = await getT();
  const areas = await prisma.area.findMany({
    where: { city: { slug: "tirana" } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const today = new Date().toISOString().slice(0, 10);
  const failed = sp.error !== undefined;

  return (
    <div className="pt-[26px]">
      <header className="border-b border-rule pb-5">
        <h1 className="display m-0 max-w-[14em] text-[clamp(30px,6vw,48px)]">
          {t("createSeekerProfile")}
        </h1>
        <p className="m-0 mt-3.5 max-w-[52ch] text-[15px] text-ink-mid">
          {lang === "sq"
            ? "Pronarët shfletojnë kërkuesit dhe shkruajnë direkt. Sa më konkret të jesh, aq më shumë përgjigje merr."
            : "Landlords browse seekers and message directly. The more concrete you are, the more replies you get."}
        </p>
      </header>

      {failed && (
        <p className="m-0 mt-5 border-l-2 border-ink bg-sunk px-3 py-2 text-[13px]">
          {t("required")}
        </p>
      )}

      <form action={createListing} className="max-w-[760px] pb-10">
        <input type="hidden" name="direction" value="WANTED" />

        <h2 className="section-rule mt-8">{t("sectionBasics")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="propertyKind">{t("seekerLooking")}</label>
            <select id="propertyKind" name="propertyKind" required className="field" defaultValue="ROOM">
              <option value="ROOM">{t("fTypeRoom")}</option>
              <option value="WHOLE_UNIT">{t("fTypeApartment")}</option>
              <option value="SHORT_TERM">{t("fTypeSublet")}</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="layout">{t("fLayout")}</label>
            <select id="layout" name="layout" className="field" defaultValue="">
              <option value="">—</option>
              {LAYOUT_ORDER.map((l) => (
                <option key={l} value={l}>{LAYOUT_LABEL[l]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="title">{t("fieldTitle")}</label>
          <input
            id="title" name="title" required minLength={8} maxLength={160}
            placeholder={
              lang === "sq"
                ? "P.sh. “Student kërkon dhomë pranë UT-së nga tetori”"
                : "e.g. “Student looking for a room near UT from October”"
            }
            className="field !py-[11px] text-[15px]"
          />
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="description">{t("fieldDescription")}</label>
          <textarea
            id="description" name="description" required minLength={30} maxLength={4000} rows={6}
            className="field leading-relaxed"
            placeholder={
              lang === "sq"
                ? "Kush je, ku punon ose studion, sa i qetë je, çfarë kërkon te bashkëbanuesit."
                : "Who you are, where you work or study, how quiet you are, what you want in flatmates."
            }
          />
        </div>

        <h2 className="section-rule mt-8">{t("sectionPrice")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="priceAmount">{t("seekerBudgetUpTo")}</label>
            <input
              id="priceAmount" name="priceAmount" type="number" min={1} step={5} required
              inputMode="numeric" className="field figure"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="priceCurrency">
              {lang === "sq" ? "Monedha" : "Currency"}
            </label>
            <select id="priceCurrency" name="priceCurrency" className="field" defaultValue="EUR">
              <option value="EUR">EUR (€)</option>
              <option value="ALL">Lek (L)</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="occupationPref">{t("seekerOccupation")}</label>
            <input id="occupationPref" name="occupationPref" maxLength={80} className="field" />
          </div>
        </div>

        <h2 className="section-rule mt-8">{t("seekerAreas")}</h2>
        <p className="m-0 mt-2 text-[12px] text-ink-mute">
          {lang === "sq"
            ? "Zgjidh sa të duash. Pa zgjedhje do të thotë kudo në Tiranë."
            : "Pick as many as you like. Choosing none means anywhere in Tirana."}
        </p>
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-5 gap-y-1.5">
          {areas.map((a) => (
            <label
              key={a.slug}
              className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-mid"
            >
              <input
                type="checkbox" name="areas" value={a.slug}
                className="h-[16px] w-[16px] accent-[var(--cobalt)]"
              />
              {a.name}
            </label>
          ))}
        </div>

        <h2 className="section-rule mt-8">{t("sectionAvailability")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="availableFrom">{t("seekerMoveIn")}</label>
            <input
              id="availableFrom" name="availableFrom" type="date" required
              defaultValue={today} className="field figure"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="minStayMonths">{t("seekerStay")}</label>
            <input
              id="minStayMonths" name="minStayMonths" type="number" min={1} max={60}
              defaultValue={12} className="field figure"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-mid">
            <input type="checkbox" name="petsAllowed" value="1" className="h-[17px] w-[17px] accent-[var(--cobalt)]" />
            {lang === "sq" ? "Kam kafshë shtëpiake" : "I have a pet"}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-mid">
            <input type="checkbox" name="smokingAllowed" value="1" className="h-[17px] w-[17px] accent-[var(--cobalt)]" />
            {lang === "sq" ? "Pi duhan" : "I smoke"}
          </label>
        </div>

        <div className="mt-8 border-t-2 border-ink pt-4">
          <button type="submit" className="btn-primary min-h-12 w-full sm:w-auto">
            {t("publish")}
          </button>
        </div>
      </form>
    </div>
  );
}

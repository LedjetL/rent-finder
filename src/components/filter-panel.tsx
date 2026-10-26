import type { SearchCriteria } from "@/lib/search";
import { CAMPUSES } from "@/lib/tirana";
import { LAYOUT_LABEL, LAYOUT_ORDER } from "@/lib/domain";
import type { Lang, T } from "@/lib/i18n";

type Area = { slug: string; name: string; count: number };

/**
 * Filters sit across the top as a rule-bounded band rather than in a sidebar —
 * the search itself is part of the masthead, and the results get the full measure
 * of the page.
 *
 * Still a plain GET form: state lives in the URL, results are shareable, the back
 * button behaves, and it works with JavaScript off.
 */
export function FilterPanel({
  criteria,
  areas,
  action = "/listings",
  lang,
  t,
}: {
  criteria: SearchCriteria;
  areas: Area[];
  action?: string;
  lang: Lang;
  t: T;
}) {
  const c = criteria;

  return (
    <form
      action={action}
      method="get"
      className="border-b border-rule pb-[22px] pt-[18px]"
    >
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="min-w-0 flex-[1_1_240px]">
          <label className="field-label" htmlFor="q">
            {t("fArea")}
          </label>
          <input
            id="q"
            name="q"
            defaultValue={c.q ?? ""}
            placeholder={lang === "sq" ? "Blloku, Astir, te Komuna…" : "Blloku, Astir…"}
            className="field !py-[11px] text-[15px]"
          />
        </div>
        <button type="submit" className="btn-primary flex-none">
          {t("applyFilters")}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-x-3.5 gap-y-2.5">
        <div>
          <label className="field-label" htmlFor="kind">
            {t("fType")}
          </label>
          <select id="kind" name="kind" defaultValue={c.propertyKind ?? ""} className="field">
            <option value="">{t("anyKind")}</option>
            <option value="ROOM">{t("fTypeRoom")}</option>
            <option value="WHOLE_UNIT">{t("fTypeApartment")}</option>
            <option value="SHORT_TERM">{t("fTypeSublet")}</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="layout">
            {t("fLayout")}
          </label>
          <select id="layout" name="layout" defaultValue={c.layout ?? ""} className="field">
            <option value="">{t("fAnyLayout")}</option>
            {LAYOUT_ORDER.map((l) => (
              <option key={l} value={l}>
                {LAYOUT_LABEL[l]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="area">
            {t("fArea")}
          </label>
          <select id="area" name="area" defaultValue={c.areaSlug ?? ""} className="field">
            <option value="">{t("fAnyArea")}</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name} ({a.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="min">
            {t("fPriceMin")}
          </label>
          <input
            id="min" name="min" type="number" min={0} step={10} inputMode="numeric"
            defaultValue={c.minEur ?? ""} className="field figure"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="max">
            {t("fPriceMax")}
          </label>
          <input
            id="max" name="max" type="number" min={0} step={10} inputMode="numeric"
            defaultValue={c.maxEur ?? ""} className="field figure"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="from">
            {t("fFrom")}
          </label>
          <input
            id="from" name="from" type="date"
            defaultValue={c.availableFrom?.toISOString().slice(0, 10) ?? ""}
            className="field figure"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="campus">
            {t("fCampus")}
          </label>
          <select id="campus" name="campus" defaultValue={c.campusSlug ?? ""} className="field">
            <option value="">{t("fAnyCampus")}</option>
            {CAMPUSES.map((u) => (
              <option key={u.slug} value={u.slug}>
                {u.shortName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="walk">
            {t("fMaxWalk")}
          </label>
          <select id="walk" name="walk" defaultValue={c.maxWalkMinutes ?? ""} className="field">
            <option value="">—</option>
            <option value="10">10 min</option>
            <option value="20">20 min</option>
            <option value="30">30 min</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {(
          [
            ["nofee", t("fNoAgencyFee"), c.noAgencyFee],
            ["bills", t("utilitiesIncluded"), c.utilitiesIncluded],
            ["balcony", t("fBalcony"), c.balcony],
            ["washer", t("fWasher"), c.washer],
            ["parking", t("fParking"), c.parking],
            ["pets", t("fPets"), c.pets],
          ] as const
        ).map(([name, text, checked]) => (
          <label
            key={name}
            className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-mid"
          >
            <input
              type="checkbox" name={name} value="1" defaultChecked={!!checked}
              className="h-[17px] w-[17px] accent-[var(--cobalt)]"
            />
            {text}
          </label>
        ))}
        <a href={action} className="text-[13px] text-ink-mute no-underline hover:text-ink">
          {t("clearFilters")}
        </a>
      </div>
    </form>
  );
}

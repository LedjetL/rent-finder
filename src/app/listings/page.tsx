import Link from "next/link";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { areasWithCounts, criteriaToQuery, parseCriteria, searchListings } from "@/lib/search";
import { ListingRow } from "@/components/listing-row";
import { FilterPanel } from "@/components/filter-panel";
import { SORTS } from "@/lib/domain";

export const metadata: Metadata = { title: "Kërko" };

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const { lang, t } = await getT();
  const criteria = parseCriteria(raw, "OFFER");

  const [result, areas] = await Promise.all([
    searchListings(criteria),
    areasWithCounts("OFFER"),
  ]);

  const sortLabel: Record<(typeof SORTS)[number], string> = {
    newest: t("sortNewest"),
    price_asc: t("sortPriceAsc"),
    upfront_asc: t("sortUpfront"),
    price_desc: t("sortPriceDesc"),
    size_desc: t("sortSizeDesc"),
  };

  const [lead, ...rest] = result.items;

  return (
    <div>
      <FilterPanel criteria={criteria} areas={areas} lang={lang} t={t} />

      <div className="flex flex-wrap items-baseline gap-x-[18px] gap-y-2 pb-2 pt-4">
        <p className="m-0 text-[13px] text-ink-mid">
          <span className="figure text-ink">{result.total}</span> {t("resultsFound")}
        </p>
        <span className="flex-1" />
        <nav className="flex flex-wrap gap-3.5 text-[12px]">
          {SORTS.map((s) => {
            const active = criteria.sort === s;
            return (
              <Link
                key={s}
                href={`/listings${criteriaToQuery(criteria, {
                  sort: s === "newest" ? undefined : s,
                  page: undefined,
                })}`}
                className={
                  active
                    ? "border-b-2 border-ink pb-0.5 text-ink no-underline"
                    : "text-ink-mute no-underline hover:text-ink"
                }
              >
                {sortLabel[s]}
              </Link>
            );
          })}
        </nav>
      </div>

      {result.items.length === 0 ? (
        <div className="border-t-2 border-ink py-16 text-center">
          <p className="display m-0 text-[26px]">{t("noResults")}</p>
          <p className="m-0 mt-2 text-[14px] text-ink-mute">{t("noResultsHint")}</p>
        </div>
      ) : (
        <>
          <ListingRow listing={lead} lang={lang} t={t} variant="lead" />
          {rest.map((l) => (
            <ListingRow key={l.id} listing={l} lang={lang} t={t} />
          ))}
        </>
      )}

      {result.pageCount > 1 && (
        <nav className="mt-[30px] flex items-baseline gap-4 border-t border-rule pt-3.5 text-[13px]">
          {criteria.page > 1 && (
            <Link
              href={`/listings${criteriaToQuery(criteria, { page: criteria.page - 1 })}`}
              className="border-b border-cobalt pb-px text-ink no-underline"
            >
              ← {t("prev")}
            </Link>
          )}
          <span className="figure text-ink-mute">
            {criteria.page} / {result.pageCount}
          </span>
          <span className="flex-1" />
          {criteria.page < result.pageCount && (
            <Link
              href={`/listings${criteriaToQuery(criteria, { page: criteria.page + 1 })}`}
              className="border-b border-cobalt pb-px text-ink no-underline"
            >
              {t("next")} →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

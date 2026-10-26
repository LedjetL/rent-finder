import Link from "next/link";
import type { ListingCardData } from "@/lib/search";
import { LAYOUT_LABEL, formatMoney } from "@/lib/domain";
import {
  type Lang,
  type T,
  bathroomLabel,
  formatDate,
  propertyKindLabel,
} from "@/lib/i18n";

/**
 * A listing as an editorial entry, not a card.
 *
 * The first result gets the lead treatment — a wide image and a masthead-scale
 * headline — and everything after it is a split row divided by a hairline. There
 * are no boxes and no shadows anywhere; the rules carry the structure.
 *
 * Two figures always sit together: the rent, and beneath it in cobalt the cash
 * actually handed over at signing. Showing the second one next to the first is the
 * entire argument of the site, so it is the only coloured thing on the page.
 */

function ledgerLine(l: ListingCardData, lang: Lang, t: T): string {
  const parts = [formatMoney(l.priceEurCents, "EUR", lang)];
  if (l.depositMonths > 0) {
    parts.push(
      `${formatMoney(l.priceEurCents * l.depositMonths, "EUR", lang)} ${t("depositShort")}`,
    );
  }
  if (l.agencyFee) {
    parts.push(
      `${formatMoney(Math.round(l.priceEurCents / 2), "EUR", lang)} ${t("commissionShort")}`,
    );
  }
  return parts.join("  +  ");
}

function meta(l: ListingCardData, lang: Lang, t: T): string {
  const bits = [l.area?.name ?? ""];
  if (l.layout) bits.push(LAYOUT_LABEL[l.layout]);
  if (l.propertyKind === "ROOM" && l.roomSizeM2) bits.push(`${l.roomSizeM2} m²`);
  else if (l.sizeM2) bits.push(`${l.sizeM2} m²`);
  if (l.propertyKind === "ROOM") {
    bits.push(bathroomLabel(lang, l.bathroom));
  }
  if (l.propertyKind === "ROOM" && l.flatmatesTotal) {
    bits.push(`${l.flatmatesTotal} ${t("flatmatesCount")}`);
  }
  return bits.filter(Boolean).join(" · ");
}

export function ListingRow({
  listing,
  lang,
  t,
  variant = "row",
}: {
  listing: ListingCardData;
  lang: Lang;
  t: T;
  variant?: "lead" | "row";
}) {
  const title =
    listing.translations.find((x) => x.locale === lang)?.title || listing.title;
  const photo = listing.media[0]?.url;
  const lead = variant === "lead";

  const flag = [
    propertyKindLabel(lang, listing.propertyKind),
    !listing.agencyFee ? t("noAgencyFee") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const trust = [
    listing.owner.phoneVerifiedAt ? t("phoneVerified") : null,
    listing.utilitiesIncluded ? t("utilitiesIncluded") : t("utilitiesExtra"),
  ]
    .filter(Boolean)
    .join(" · ");

  const avail = `${t("availableFrom")} ${formatDate(listing.availableFrom, lang)}${
    listing.availableTo ? ` — ${formatDate(listing.availableTo, lang)}` : ""
  }`;

  const rentBlock = (
    <>
      <p className="figure m-0 leading-none tracking-[-0.02em]" style={{ fontSize: lead ? 30 : 25 }}>
        {formatMoney(listing.priceAmountCents, listing.priceCurrency, lang)}
        <span
          className="font-sans tracking-normal text-ink-mute"
          style={{ fontSize: lead ? 13 : 12 }}
        >
          {t("perMonth")}
        </span>
      </p>
    </>
  );

  const upfrontBlock = (
    <div
      className={
        lead
          ? "mt-3 flex items-baseline justify-between gap-3 border-t border-rule-soft pt-2"
          : "text-right"
      }
    >
      <span className="text-[10px] uppercase tracking-[0.1em] text-ink-mid sm:text-[11px]">
        {t("upfront")}
      </span>
      <span
        className="figure block text-cobalt"
        style={{ fontSize: lead ? 20 : 18 }}
      >
        {formatMoney(listing.upfrontEurCents, "EUR", lang)}
      </span>
    </div>
  );

  const ledger = (
    <p className="figure m-0 mt-1.5 text-[11px] leading-[1.5] text-ink-mute">
      {ledgerLine(listing, lang, t)}
    </p>
  );

  if (lead) {
    return (
      <article className="border-t-2 border-ink pt-3.5">
        <Link href={`/listings/${listing.id}`} className="block text-inherit no-underline">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-sunk">
            {photo && (
              /* eslint-disable-next-line @next/next/no-img-element -- generated SVG placeholder */
              <img src={photo} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-[26px] gap-y-1.5">
            <div className="min-w-0 flex-[1_1_300px]">
              <p className="label m-0 mb-1.5 text-cobalt">{flag}</p>
              <h2 className="display m-0 text-[clamp(24px,4.4vw,40px)] leading-[1.06] tracking-[-0.015em]">
                {title}
              </h2>
              <p className="m-0 mt-2.5 text-[14px] text-ink-mid">{meta(listing, lang, t)}</p>
              <p className="m-0 mt-1 text-[13px] text-ink-mute">{avail}</p>
              <p className="m-0 mt-3 text-[11px] uppercase tracking-[0.1em] text-ink-mid">
                {trust}
              </p>
            </div>
            <div className="min-w-[180px] flex-[0_1_240px] border-t border-rule pt-2.5">
              {rentBlock}
              {upfrontBlock}
              {ledger}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="mt-[26px] border-t border-rule pt-3.5">
      <Link
        href={`/listings/${listing.id}`}
        className="flex flex-wrap gap-x-6 gap-y-3.5 text-inherit no-underline"
      >
        <div className="min-w-0 flex-[1_1_300px]">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-sunk">
            {photo && (
              /* eslint-disable-next-line @next/next/no-img-element -- generated SVG placeholder */
              <img src={photo} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col">
          <p className="label m-0 mb-1.5 text-cobalt">{flag}</p>
          <h2 className="display m-0 text-[clamp(20px,2.6vw,27px)] leading-[1.1] tracking-[-0.01em]">
            {title}
          </h2>
          <p className="m-0 mt-2 text-[14px] text-ink-mid">{meta(listing, lang, t)}</p>
          <p className="m-0 mt-0.5 text-[13px] text-ink-mute">{avail}</p>
          <p className="m-0 mb-3.5 mt-2 text-[11px] uppercase tracking-[0.1em] text-ink-mid">
            {trust}
          </p>
          <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 border-t border-rule pt-2.5">
            {rentBlock}
            {upfrontBlock}
          </div>
          {ledger}
        </div>
      </Link>
    </article>
  );
}

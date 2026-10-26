import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  getT,
  formatDate,
  bathroomLabel,
  furnishedLabel,
  heatingLabel,
  propertyKindLabel,
} from "@/lib/i18n";
import { LAYOUT_LABEL, formatAlternate, formatMoney } from "@/lib/domain";
import { CAMPUSES, distanceKm, walkMinutes } from "@/lib/tirana";
import { ContactReveal } from "@/components/contact-reveal";
import { reportListing, toggleFavorite } from "@/app/actions/engagement";

async function getListing(id: string) {
  return prisma.listing.findFirst({
    where: { id, direction: "OFFER", moderationState: "APPROVED" },
    include: {
      area: true,
      media: { orderBy: { sort: "asc" } },
      translations: true,
      owner: {
        select: {
          displayName: true,
          createdAt: true,
          bio: true,
          phoneVerifiedAt: true,
          verifications: { where: { state: "VERIFIED" }, select: { kind: true } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, { lang, t }, user] = await Promise.all([
    getListing(id),
    getT(),
    getCurrentUser(),
  ]);

  if (!listing) notFound();

  const favorited = user
    ? (await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: user.id, listingId: listing.id } },
        select: { id: true },
      })) !== null
    : false;

  const title = listing.translations.find((x) => x.locale === lang)?.title ?? listing.title;
  const description =
    listing.translations.find((x) => x.locale === lang)?.description ?? listing.description;

  const deposit = listing.priceEurCents * listing.depositMonths;
  const commission = listing.agencyFee ? Math.round(listing.priceEurCents / 2) : 0;
  const isRoom = listing.propertyKind === "ROOM";

  const nearest =
    listing.lat != null && listing.lng != null
      ? CAMPUSES.map((c) => ({
          campus: c,
          km: distanceKm({ lat: listing.lat!, lng: listing.lng! }, c),
        })).sort((a, b) => a.km - b.km)[0]
      : null;

  // The ledger.
  //
  // The total is deliberately the CASH NEEDED ON THE DAY, because that is the real
  // barrier — a seeker with €300 saved cannot take a €110 room that needs €385. But
  // the deposit is the renter's own money on loan, while the commission is simply
  // gone, so the rows carry that distinction rather than reading as one flat cost.
  const ledger: { label: string; amount: number; refundable: boolean }[] = [
    { label: t("firstMonth"), amount: listing.priceEurCents, refundable: false },
    // Plenty of room shares ask for no deposit at all — don't show an empty row.
    ...(listing.depositMonths > 0
      ? [
          {
            label: `${t("deposit")} · ${listing.depositMonths} ${t("months")}`,
            amount: deposit,
            refundable: true,
          },
        ]
      : []),
    ...(commission
      ? [{ label: t("commission"), amount: commission, refundable: false }]
      : []),
  ];

  const refundable = deposit;
  const gone = listing.upfrontEurCents - refundable;

  const facts: [string, string][] = [
    ...(listing.layout ? ([[t("fLayout"), LAYOUT_LABEL[listing.layout]]] as [string, string][]) : []),
    ...(listing.sizeM2 ? ([[t("size"), `${listing.sizeM2} m²`]] as [string, string][]) : []),
    ...(isRoom && listing.roomSizeM2
      ? ([[t("roomSize"), `${listing.roomSizeM2} m²`]] as [string, string][])
      : []),
    ...(isRoom
      ? ([[
          lang === "sq" ? "Tualeti" : "Bathroom",
          bathroomLabel(lang, listing.bathroom),
        ]] as [string, string][])
      : []),
    [t("furnishedLabel"), furnishedLabel(lang, listing.furnished)],
    [t("heating"), heatingLabel(lang, listing.heating)],
    ...(listing.floor != null ? ([[t("floor"), String(listing.floor)]] as [string, string][]) : []),
    [t("elevator"), listing.hasElevator ? t("yes") : t("no")],
    [t("availableFrom"), formatDate(listing.availableFrom, lang)],
    [
      t("availableUntil"),
      listing.availableTo ? formatDate(listing.availableTo, lang) : t("openEnded"),
    ],
    [t("minStay"), listing.minStayMonths ? `${listing.minStayMonths} ${t("months")}` : "—"],
    ...(isRoom && listing.flatmatesTotal
      ? ([[t("flatmates"), String(listing.flatmatesTotal)]] as [string, string][])
      : []),
  ];

  const trustMarks = [
    listing.owner.phoneVerifiedAt ? t("phoneVerified") : null,
    listing.owner.verifications.some((v) => v.kind === "MET_IN_PERSON")
      ? t("metInPerson")
      : null,
    listing.owner.verifications.some((v) => v.kind === "OWNERSHIP_DOC")
      ? lang === "sq"
        ? "Dokument pronësie"
        : "Ownership document"
      : null,
  ].filter(Boolean) as string[];

  const meta = [
    listing.area?.name,
    listing.addressHint,
    nearest ? `${walkMinutes(nearest.km)} min ${t("walkTo")} ${nearest.campus.shortName}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article>
      <p className="m-0 border-b border-rule-soft py-3 text-[12px]">
        <Link href="/listings" className="text-ink-mute no-underline hover:text-ink">
          ← {t("backToSearch")}
        </Link>
      </p>

      {listing.status === "TAKEN" && (
        <p className="mt-4 border-l-2 border-ink bg-sunk px-4 py-2.5 text-[13px] uppercase tracking-[0.1em]">
          {t("rentedBanner")}
        </p>
      )}

      <div className="mt-[18px] flex flex-wrap gap-1.5">
        <div className="relative aspect-[3/2] min-w-0 flex-[1_1_420px] overflow-hidden bg-sunk">
          {listing.media[0] && (
            /* eslint-disable-next-line @next/next/no-img-element -- generated SVG placeholder */
            <img src={listing.media[0].url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_180px] flex-wrap gap-1.5">
          {listing.media.slice(1, 4).map((m) => (
            <div
              key={m.id}
              className="relative aspect-square flex-[1_1_100px] overflow-hidden bg-sunk"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG placeholder */}
              <img src={m.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[26px] flex flex-wrap gap-x-11 gap-y-7">
        {/* ── left column ── */}
        <div className="min-w-0 flex-[1_1_380px]">
          <p className="label m-0 mb-2 text-cobalt">
            {[propertyKindLabel(lang, listing.propertyKind), !listing.agencyFee ? t("noAgencyFee") : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="display m-0 text-[clamp(28px,5.6vw,46px)]">{title}</h1>
          <p className="m-0 mt-3 text-[15px] text-ink-mid">{meta}</p>

          <h2 className="section-rule mt-[30px]">{t("description")}</h2>
          <p className="m-0 mt-3 max-w-[62ch] whitespace-pre-line text-[15px] leading-[1.6] text-ink-mid">
            {description}
          </p>

          <h2 className="section-rule mt-[30px]">{t("amenities")}</h2>
          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-x-8">
            {facts.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-3.5 border-b border-rule-soft py-2.5"
              >
                <dt className="text-[13px] text-ink-mute">{k}</dt>
                <dd className="figure m-0 text-right text-[14px]">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="section-rule mt-[30px]">{t("location")}</h2>
          <p className="m-0 mt-3 max-w-[56ch] text-[14px] text-ink-mute">{t("locationNote")}</p>
        </div>

        {/* ── price rail ── */}
        <aside className="min-w-0 flex-[1_1_320px] self-start">
          <div className="border-t-2 border-ink pt-3">
            <p className="figure m-0 text-[clamp(34px,7vw,44px)] leading-none tracking-[-0.03em]">
              {formatMoney(listing.priceAmountCents, listing.priceCurrency, lang)}
              <span className="font-sans text-[14px] tracking-normal text-ink-mute">
                {t("perMonth")}
              </span>
            </p>
            <p className="figure m-0 mt-1.5 text-[12px] text-ink-mute">
              {formatAlternate(listing.priceEurCents, listing.priceCurrency, lang)}
              {" · "}
              {listing.utilitiesIncluded
                ? t("utilitiesIncluded")
                : `${t("utilitiesExtra")}${
                    listing.utilitiesEurCents
                      ? ` ~${formatMoney(listing.utilitiesEurCents, "EUR", lang)}`
                      : ""
                  }`}
            </p>
          </div>

          <h2 className="mt-6 text-[11px] uppercase tracking-[0.14em] text-ink-mid">
            {t("costBreakdown")}
          </h2>
          <table className="figure mt-2 w-full border-collapse">
            <tbody>
              {ledger.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="border-b border-rule-soft py-2.5 text-left font-sans text-[13px] font-normal text-ink-mid"
                  >
                    {row.label}
                    {row.refundable && (
                      <span className="ml-1.5 text-[11px] uppercase tracking-[0.08em] text-trust">
                        · {t("refundable")}
                      </span>
                    )}
                  </th>
                  <td className="whitespace-nowrap border-b border-rule-soft py-2.5 text-right text-[15px]">
                    {formatMoney(row.amount, "EUR", lang)}
                  </td>
                </tr>
              ))}
              {/* A double rule above the total: the accounting convention, and the
                  reason this table reads as a statement rather than a price badge. */}
              <tr>
                <th
                  scope="row"
                  className="border-t-[3px] border-double border-ink pt-3 text-left font-sans text-[12px] font-semibold uppercase tracking-[0.08em]"
                >
                  {t("cashOnTheDay")}
                </th>
                <td className="whitespace-nowrap border-t-[3px] border-double border-ink pt-3 text-right text-[23px] text-cobalt">
                  {formatMoney(listing.upfrontEurCents, "EUR", lang)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Splitting the total is the honest part: a deposit is the renter's own
              money on loan, a commission is not. With no deposit there is nothing
              to split, so the whole block goes rather than showing "refundable €0". */}
          {refundable > 0 && (
            <>
              <dl className="m-0 mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
                <div className="flex gap-1.5">
                  <dt className="text-trust">{t("refundable")}</dt>
                  <dd className="figure m-0 text-ink-mid">
                    {formatMoney(refundable, "EUR", lang)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-ink-mute">{t("notRecovered")}</dt>
                  <dd className="figure m-0 text-ink-mid">
                    {formatMoney(gone, "EUR", lang)}
                  </dd>
                </div>
              </dl>
              <p className="m-0 mt-2 max-w-[40ch] text-[12px] leading-[1.55] text-ink-mute">
                {t("refundableNote")}
              </p>
            </>
          )}

          {refundable === 0 && !commission && (
            <p className="m-0 mt-2.5 max-w-[40ch] text-[12px] leading-[1.55] text-trust">
              {t("noDepositNote")}
            </p>
          )}
          <p className="m-0 mt-2 max-w-[40ch] text-[12px] leading-[1.55] text-ink-mid">
            {listing.agencyFee ? t("withCommissionNote") : t("noCommissionNote")}
          </p>

          <div className="mt-[22px]">
            <ContactReveal
              listingId={listing.id}
              signedIn={!!user}
              labels={{
                show: t("contactShow"),
                whatsapp: t("contactWhatsapp"),
                login: t("loginToContact"),
                note: t("contactNote"),
                loading: t("loading"),
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <form action={toggleFavorite}>
              <input type="hidden" name="listingId" value={listing.id} />
              <button
                type="submit"
                className="cursor-pointer border-0 bg-transparent p-0 text-ink-mid underline underline-offset-2 hover:text-ink"
              >
                {favorited ? `✓ ${t("saved")}` : t("save")}
              </button>
            </form>

            {/* Reporting is core, not a footer link: fake listings and deposit fraud
                are the main reason people distrust renting online in Tirana. */}
            <details className="flex-1">
              <summary className="cursor-pointer list-none text-ink-mute underline underline-offset-2 hover:text-ink">
                {t("report")}
              </summary>
              <form action={reportListing} className="mt-3 border-l-2 border-rule pl-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <label className="field-label" htmlFor="reason">
                  {t("reportReason")}
                </label>
                <select id="reason" name="reason" className="field" defaultValue="SCAM">
                  <option value="SCAM">{t("reasonSCAM")}</option>
                  <option value="WRONG_PRICE">{t("reasonWRONG_PRICE")}</option>
                  <option value="ALREADY_RENTED">{t("reasonALREADY_RENTED")}</option>
                  <option value="AGENCY_POSING">{t("reasonAGENCY_POSING")}</option>
                  <option value="STOLEN_PHOTOS">
                    {lang === "sq" ? "Foto të vjedhura" : "Stolen photos"}
                  </option>
                  <option value="OTHER">{t("reasonOTHER")}</option>
                </select>
                <label className="field-label mt-2.5" htmlFor="detail">
                  {t("reportDetail")}
                </label>
                <textarea id="detail" name="detail" rows={3} maxLength={1000} className="field" />
                <button
                  type="submit"
                  className="mt-2.5 border border-rule bg-transparent px-3 py-2 text-[13px] text-ink-mid hover:text-ink"
                >
                  {t("reportSubmit")}
                </button>
              </form>
            </details>
          </div>

          <h2 className="section-rule mt-[26px]">{t("aboutLister")}</h2>
          <p className="m-0 mt-3 text-[15px]">{listing.owner.displayName}</p>
          <p className="m-0 mt-0.5 text-[12px] text-ink-mute">
            {t("memberSince")} {formatDate(listing.owner.createdAt, lang)}
          </p>
          {trustMarks.length > 0 && (
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              {trustMarks.map((m) => (
                <li
                  key={m}
                  className="border-l-2 border-rule pl-2.5 text-[11px] uppercase tracking-[0.1em] text-ink-mid"
                >
                  {m}
                </li>
              ))}
            </ul>
          )}
          {listing.owner.bio && (
            <p className="m-0 mt-3 text-[13px] leading-relaxed text-ink-mute">
              {listing.owner.bio}
            </p>
          )}
        </aside>
      </div>

      <div className="mt-11 flex flex-wrap gap-x-[30px] gap-y-2 border-t border-rule pt-3.5">
        <h2 className="display m-0 flex-none text-[19px]">{t("trustTitle")}</h2>
        <p className="m-0 max-w-[70ch] flex-[1_1_300px] text-[13px] leading-[1.6] text-ink-mid">
          {t("trustBody")}
        </p>
      </div>
    </article>
  );
}

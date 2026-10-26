import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT, formatDate, propertyKindLabel } from "@/lib/i18n";
import { formatMoney } from "@/lib/domain";
import { markTaken, relist } from "@/app/actions/listings";
import { logout } from "@/app/actions/engagement";

export const metadata: Metadata = { title: "Njoftimet e mia" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const { lang, t } = await getT();

  const listings = await prisma.listing.findMany({
    where: { ownerId: user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      direction: true,
      propertyKind: true,
      status: true,
      moderationState: true,
      priceEurCents: true,
      upfrontEurCents: true,
      viewCount: true,
      contactCount: true,
      firstPublishedAt: true,
      area: { select: { name: true } },
    },
  });

  // The people who actually revealed contact on each listing — the candidates for
  // "who did it go to?". This is what turns the log into match attribution rather
  // than a traffic counter.
  const ids = listings.map((l) => l.id);
  const contacts = ids.length
    ? await prisma.event.findMany({
        where: { verb: "CONTACT_REVEALED", subjectType: "Listing", subjectId: { in: ids } },
        select: { subjectId: true, actorUserId: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
      })
    : [];

  const actorIds = [...new Set(contacts.map((c) => c.actorUserId).filter(Boolean))] as string[];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, displayName: true },
      })
    : [];
  const actorName = new Map(actors.map((a) => [a.id, a.displayName]));

  const contactsFor = (listingId: string) => {
    const seen = new Set<string>();
    return contacts
      .filter((c) => c.subjectId === listingId && c.actorUserId)
      .filter((c) => (seen.has(c.actorUserId!) ? false : (seen.add(c.actorUserId!), true)))
      .map((c) => ({ id: c.actorUserId!, name: actorName.get(c.actorUserId!) ?? "—" }));
  };

  const offers = listings.filter((l) => l.direction === "OFFER");
  const wanted = listings.filter((l) => l.direction === "WANTED");

  return (
    <div className="pt-[26px]">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="display m-0 text-[clamp(28px,5vw,42px)]">{t("navMyListings")}</h1>
          <p className="m-0 mt-2 text-[14px] text-ink-mid">
            {user.displayName}
            {user.phoneVerified && (
              <span className="ml-2 border-l-2 border-rule pl-2 text-[11px] uppercase tracking-[0.1em]">
                {t("phoneVerified")}
              </span>
            )}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="border border-rule bg-transparent px-3 py-2 text-[13px] text-ink-mid hover:text-ink">
            {t("navLogout")}
          </button>
        </form>
      </header>

      {sp.done === "taken" && (
        <p className="m-0 mt-5 border-l-2 border-trust bg-sunk px-3 py-2.5 text-[13px]">
          {lang === "sq"
            ? "Faleminderit — kjo na ndihmon të masim sa njoftime çojnë vërtet në një qira."
            : "Thanks — this is how we measure whether listings actually turn into tenancies."}
        </p>
      )}

      <h2 className="section-rule mt-8">{t("navMyListings")}</h2>
      {offers.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-mute">
          {lang === "sq" ? "Ende asnjë njoftim." : "No listings yet."}{" "}
          <Link href="/listings/new">{t("navPost")}</Link>
        </p>
      ) : (
        <div className="mt-2">
          {offers.map((l) => {
            const candidates = contactsFor(l.id);
            return (
              <article key={l.id} className="border-b border-rule-soft py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0 flex-[1_1_320px]">
                    <p className="label m-0 mb-1 text-cobalt">
                      {propertyKindLabel(lang, l.propertyKind)}
                      {l.moderationState === "PENDING" &&
                        ` · ${lang === "sq" ? "Në shqyrtim" : "Under review"}`}
                      {l.status === "TAKEN" && ` · ${lang === "sq" ? "Dhënë" : "Taken"}`}
                    </p>
                    <h3 className="m-0 text-[17px] font-medium leading-snug">
                      <Link href={`/listings/${l.id}`} className="text-ink no-underline hover:text-cobalt">
                        {l.title}
                      </Link>
                    </h3>
                    <p className="m-0 mt-1 text-[13px] text-ink-mute">
                      {l.area?.name}
                      {l.firstPublishedAt && ` · ${formatDate(l.firstPublishedAt, lang)}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px]">
                    <span className="figure">{formatMoney(l.priceEurCents, "EUR", lang)}</span>
                    <span className="figure text-cobalt">
                      {formatMoney(l.upfrontEurCents, "EUR", lang)}
                    </span>
                    <span className="text-ink-mute">
                      <span className="figure">{l.viewCount}</span> {t("views")}
                    </span>
                    <span className="text-ink-mute">
                      <span className="figure">{l.contactCount}</span>{" "}
                      {lang === "sq" ? "kontakte" : "contacts"}
                    </span>
                  </div>
                </div>

                {l.status === "ACTIVE" ? (
                  <form
                    action={markTaken}
                    className="mt-3 flex flex-wrap items-end gap-3 border-l-2 border-rule pl-3"
                  >
                    <input type="hidden" name="listingId" value={l.id} />
                    <div className="min-w-[220px] flex-[0_1_300px]">
                      <label className="field-label" htmlFor={`taken-${l.id}`}>
                        {lang === "sq" ? "Kujt i shkoi?" : "Who did it go to?"}
                      </label>
                      <select id={`taken-${l.id}`} name="takenByUserId" className="field" defaultValue="">
                        <option value="">
                          {candidates.length
                            ? lang === "sq"
                              ? "Dikush tjetër / nuk e them"
                              : "Someone else / rather not say"
                            : lang === "sq"
                              ? "Askush s'ka kontaktuar ende"
                              : "Nobody has made contact yet"}
                        </option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="border border-ink bg-transparent px-3.5 py-2.5 text-[13px] font-medium text-ink hover:bg-ink hover:text-plaster"
                    >
                      {lang === "sq" ? "Shëno si të dhënë" : "Mark as taken"}
                    </button>
                  </form>
                ) : (
                  <form action={relist} className="mt-3">
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className="border border-rule bg-transparent px-3.5 py-2 text-[13px] text-ink-mid hover:text-ink"
                    >
                      {lang === "sq" ? "Riaktivizo" : "Re-list"}
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}

      <h2 className="section-rule mt-10">{t("navSeekers")}</h2>
      {wanted.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-mute">
          {lang === "sq" ? "Nuk ke profil kërkuesi." : "You have no seeker profile."}{" "}
          <Link href="/seekers/new">{t("createSeekerProfile")}</Link>
        </p>
      ) : (
        <div className="mt-2">
          {wanted.map((l) => (
            <article key={l.id} className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule-soft py-4">
              <h3 className="m-0 text-[16px] font-medium">{l.title}</h3>
              <span className="figure text-[14px] text-cobalt">
                {formatMoney(l.priceEurCents, "EUR", lang)}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

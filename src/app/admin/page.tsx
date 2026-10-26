import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getAdmin } from "@/lib/admin";
import { getT, formatDate, propertyKindLabel } from "@/lib/i18n";
import { formatMoney } from "@/lib/domain";
import { hammingDistance, DUPLICATE_THRESHOLD } from "@/lib/photos";
import {
  approveListing,
  rejectListing,
  resolveReport,
  shadowListing,
} from "@/app/actions/admin";

export const metadata: Metadata = { title: "Moderim" };

/**
 * The moderation queue — tier 0 of the verification ladder.
 *
 * At ~one new listing a day, a human reading each one is not a stopgap; it is
 * cheaper and better than any automated check available at this budget, and it is
 * where the phone actually gets verified. Reports land here too, because a report
 * flow that writes to a table nobody reads is theatre.
 */
export default async function AdminPage() {
  const admin = await getAdmin();
  // 404 rather than 403: an admin surface should not confirm it exists.
  if (!admin) notFound();

  const { lang, t } = await getT();

  const [pending, reports, stats] = await Promise.all([
    prisma.listing.findMany({
      where: { moderationState: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        direction: true,
        propertyKind: true,
        priceEurCents: true,
        upfrontEurCents: true,
        createdAt: true,
        area: { select: { name: true } },
        media: { select: { url: true, phash: true } },
        owner: {
          select: {
            id: true,
            displayName: true,
            phoneE164: true,
            phoneHash: true,
            phoneVerifiedAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        reason: true,
        detail: true,
        createdAt: true,
        reporter: { select: { displayName: true } },
        listing: {
          select: { id: true, title: true, moderationState: true, status: true },
        },
      },
    }),
    prisma.listing.groupBy({
      by: ["moderationState"],
      _count: true,
    }),
  ]);

  // How many other live listings share this poster's phone — the agency signal,
  // and the same counter that later defines the paid tier.
  const phoneHashes = [...new Set(pending.map((p) => p.owner.phoneHash))];
  const phoneCounts = phoneHashes.length
    ? await prisma.listing.groupBy({
        by: ["ownerPhoneHash"],
        where: { ownerPhoneHash: { in: phoneHashes }, status: "ACTIVE" },
        _count: true,
      })
    : [];
  const listingsPerPhone = new Map(phoneCounts.map((c) => [c.ownerPhoneHash, c._count]));

  // Near-identical photos already on the site — the stolen-image signal.
  const pendingHashes = pending.flatMap((p) =>
    p.media.map((m) => m.phash).filter((h): h is bigint => h !== null),
  );
  const others = pendingHashes.length
    ? await prisma.media.findMany({
        where: {
          phash: { not: null },
          listingId: { notIn: pending.map((p) => p.id) },
        },
        select: { listingId: true, phash: true },
      })
    : [];

  const dupeFor = (listingId: string) => {
    const mine = pending.find((p) => p.id === listingId);
    if (!mine) return [];
    const hits = new Set<string>();
    for (const m of mine.media) {
      if (m.phash === null) continue;
      for (const o of others) {
        if (o.phash !== null && hammingDistance(m.phash, o.phash) <= DUPLICATE_THRESHOLD) {
          hits.add(o.listingId);
        }
      }
    }
    return [...hits];
  };

  const counts = Object.fromEntries(stats.map((s) => [s.moderationState, s._count]));

  return (
    <div className="pt-[26px]">
      <header className="border-b border-rule pb-5">
        <h1 className="display m-0 text-[clamp(28px,5vw,42px)]">
          {lang === "sq" ? "Radha e moderimit" : "Moderation queue"}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
          {(["PENDING", "APPROVED", "REJECTED", "SHADOW"] as const).map((k) => (
            <span key={k} className="text-ink-mute">
              <span className="figure text-ink">{counts[k] ?? 0}</span> {k.toLowerCase()}
            </span>
          ))}
          <span className="text-ink-mute">
            <span className="figure text-ink">{reports.length}</span>{" "}
            {lang === "sq" ? "raporte të hapura" : "open reports"}
          </span>
        </div>
      </header>

      {/* ── pending listings ── */}
      <h2 className="section-rule mt-8">
        {lang === "sq" ? "Për shqyrtim" : "Awaiting review"}
      </h2>

      {pending.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-mute">
          {lang === "sq" ? "Asgjë për të shqyrtuar." : "Nothing to review."}
        </p>
      ) : (
        <div>
          {pending.map((l) => {
            const dupes = dupeFor(l.id);
            const phoneListings = listingsPerPhone.get(l.owner.phoneHash) ?? 0;
            const flags = [
              dupes.length > 0
                ? {
                    text:
                      lang === "sq"
                        ? `Foto të ngjashme me ${dupes.length} njoftim(e) ekzistuese`
                        : `Photos match ${dupes.length} existing listing(s)`,
                    severe: true,
                  }
                : null,
              phoneListings >= 3
                ? {
                    text:
                      lang === "sq"
                        ? `${phoneListings} njoftime aktive nga i njëjti numër — ka gjasa agjenci`
                        : `${phoneListings} live listings on this number — likely an agency`,
                    severe: false,
                  }
                : null,
              !l.owner.phoneVerifiedAt
                ? {
                    text:
                      lang === "sq" ? "Numri nuk është verifikuar" : "Phone not verified",
                    severe: false,
                  }
                : null,
            ].filter(Boolean) as { text: string; severe: boolean }[];

            return (
              <article key={l.id} className="mt-6 border-t border-rule pt-4">
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  <div className="min-w-0 flex-[1_1_420px]">
                    <p className="label m-0 mb-1 text-cobalt">
                      {l.direction === "WANTED"
                        ? lang === "sq"
                          ? "Kërkues"
                          : "Seeker"
                        : propertyKindLabel(lang, l.propertyKind)}
                      {l.area?.name ? ` · ${l.area.name}` : ""}
                    </p>
                    <h3 className="m-0 text-[19px] font-medium leading-snug">
                      <Link href={`/listings/${l.id}`} className="text-ink no-underline hover:text-cobalt">
                        {l.title}
                      </Link>
                    </h3>
                    <p className="m-0 mt-2 max-w-[70ch] text-[14px] leading-relaxed text-ink-mid">
                      {l.description.slice(0, 420)}
                      {l.description.length > 420 ? "…" : ""}
                    </p>

                    {l.media.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {l.media.slice(0, 5).map((m) => (
                          /* eslint-disable-next-line @next/next/no-img-element -- moderation thumbnail */
                          <img
                            key={m.url}
                            src={m.url}
                            alt=""
                            className="h-20 w-28 bg-sunk object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {flags.length > 0 && (
                      <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
                        {flags.map((f) => (
                          <li
                            key={f.text}
                            className={`border-l-2 pl-2.5 text-[12px] uppercase tracking-[0.08em] ${
                              f.severe ? "border-ink text-ink" : "border-rule text-ink-mid"
                            }`}
                          >
                            {f.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="min-w-[240px] flex-[0_1_300px] border-t border-rule pt-3">
                    <dl className="m-0 text-[13px]">
                      <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                        <dt className="text-ink-mute">{t("perMonth")}</dt>
                        <dd className="figure m-0">
                          {formatMoney(l.priceEurCents, "EUR", lang)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                        <dt className="text-ink-mute">{t("upfront")}</dt>
                        <dd className="figure m-0 text-cobalt">
                          {formatMoney(l.upfrontEurCents, "EUR", lang)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                        <dt className="text-ink-mute">{t("postedBy")}</dt>
                        <dd className="m-0 text-right">{l.owner.displayName}</dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                        <dt className="text-ink-mute">{t("phone")}</dt>
                        <dd className="figure m-0">
                          <a href={`tel:${l.owner.phoneE164}`}>{l.owner.phoneE164}</a>
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-rule-soft py-1.5">
                        <dt className="text-ink-mute">{t("memberSince")}</dt>
                        <dd className="m-0">{formatDate(l.owner.createdAt, lang)}</dd>
                      </div>
                    </dl>

                    <form action={approveListing} className="mt-3">
                      <input type="hidden" name="listingId" value={l.id} />
                      <label className="mb-2 flex cursor-pointer items-center gap-2 text-[13px] text-ink-mid">
                        <input
                          type="checkbox" name="verifyPhone" value="1" defaultChecked
                          className="h-[16px] w-[16px] accent-[var(--cobalt)]"
                        />
                        {lang === "sq"
                          ? "E fola në telefon — verifiko numrin"
                          : "Spoke to them — mark phone verified"}
                      </label>
                      <button type="submit" className="btn-primary w-full">
                        {lang === "sq" ? "Aprovo" : "Approve"}
                      </button>
                    </form>

                    <div className="mt-2 flex gap-2">
                      <form action={shadowListing} className="flex-1">
                        <input type="hidden" name="listingId" value={l.id} />
                        <button
                          type="submit"
                          className="w-full border border-rule bg-transparent px-3 py-2 text-[13px] text-ink-mid hover:text-ink"
                        >
                          {lang === "sq" ? "Fshih" : "Shadow"}
                        </button>
                      </form>
                      <form action={rejectListing} className="flex-1">
                        <input type="hidden" name="listingId" value={l.id} />
                        <button
                          type="submit"
                          className="w-full border border-ink bg-transparent px-3 py-2 text-[13px] text-ink hover:bg-ink hover:text-plaster"
                        >
                          {lang === "sq" ? "Refuzo" : "Reject"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── reports ── */}
      <h2 className="section-rule mt-10">
        {lang === "sq" ? "Raporte" : "Reports"}
      </h2>

      {reports.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-mute">
          {lang === "sq" ? "Asnjë raport i hapur." : "No open reports."}
        </p>
      ) : (
        <div className="mt-2">
          {reports.map((r) => (
            <article
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-rule-soft py-4"
            >
              <div className="min-w-0 flex-[1_1_420px]">
                <p className="label m-0 mb-1 text-cobalt">
                  {t(`reason${r.reason}` as "reasonSCAM")}
                </p>
                <h3 className="m-0 text-[16px] font-medium">
                  <Link
                    href={`/listings/${r.listing.id}`}
                    className="text-ink no-underline hover:text-cobalt"
                  >
                    {r.listing.title}
                  </Link>
                </h3>
                {r.detail && (
                  <p className="m-0 mt-1.5 max-w-[70ch] text-[13px] text-ink-mid">{r.detail}</p>
                )}
                <p className="m-0 mt-1.5 text-[12px] text-ink-mute">
                  {r.reporter.displayName} · {formatDate(r.createdAt, lang)} ·{" "}
                  {r.listing.moderationState.toLowerCase()}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={shadowListing}>
                  <input type="hidden" name="listingId" value={r.listing.id} />
                  <button
                    type="submit"
                    className="border border-ink bg-transparent px-3 py-2 text-[13px] text-ink hover:bg-ink hover:text-plaster"
                  >
                    {lang === "sq" ? "Fshih njoftimin" : "Shadow listing"}
                  </button>
                </form>
                <form action={resolveReport}>
                  <input type="hidden" name="reportId" value={r.id} />
                  <button
                    type="submit"
                    className="border border-rule bg-transparent px-3 py-2 text-[13px] text-ink-mid hover:text-ink"
                  >
                    {lang === "sq" ? "Mbyll" : "Dismiss"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

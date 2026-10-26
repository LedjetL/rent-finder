import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { LISTING_CARD_SELECT } from "@/lib/search";
import { ListingRow } from "@/components/listing-row";

export const metadata: Metadata = { title: "Të preferuarat" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/favorites");

  const { lang, t } = await getT();

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { listing: { select: LISTING_CARD_SELECT } },
  });

  const listings = favorites.map((f) => f.listing);
  const [lead, ...rest] = listings;

  return (
    <div className="pt-[26px]">
      <header className="border-b border-rule pb-5">
        <h1 className="display m-0 text-[clamp(30px,6vw,48px)]">{t("favoritesTitle")}</h1>
      </header>

      {listings.length === 0 ? (
        <p className="border-t-2 border-ink py-16 text-center text-[14px] text-ink-mute">
          {t("noFavorites")}
        </p>
      ) : (
        <div className="pt-6">
          <ListingRow listing={lead} lang={lang} t={t} variant="lead" />
          {rest.map((l) => (
            <ListingRow key={l.id} listing={l} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

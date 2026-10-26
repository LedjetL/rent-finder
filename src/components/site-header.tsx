import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setLanguage } from "@/app/actions/locale";

/**
 * Masthead, not a nav bar. The wordmark is set in the display face with the city
 * in italic — the one flourish on the page, and the thing that makes it read as a
 * publication rather than a product chrome.
 */
export async function SiteHeader() {
  const [{ lang, t }, user] = await Promise.all([getT(), getCurrentUser()]);

  const langBtn = (active: boolean) =>
    [
      "border-0 bg-transparent px-1.5 py-1 text-[12px] lowercase cursor-pointer",
      active ? "text-ink underline underline-offset-2" : "text-ink-mute",
    ].join(" ");

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-[18px] gap-y-2.5 border-b border-rule bg-paper px-[18px] py-3">
      <Link
        href="/"
        className="display text-[21px] leading-none tracking-[-0.015em] text-ink no-underline"
      >
        Rent Finder <span className="italic">Tiranë</span>
      </Link>

      <nav className="flex items-center gap-4 text-[13px]">
        <Link href="/listings" className="text-ink-mid no-underline hover:text-ink">
          {t("navSearch")}
        </Link>
        <Link href="/seekers" className="text-ink-mid no-underline hover:text-ink">
          {t("navSeekers")}
        </Link>
        <Link
          href="/kontrollo"
          className="font-semibold text-[var(--accent)] no-underline hover:text-[var(--accent-deep)]"
        >
          {t("checkTitle")}
        </Link>
      </nav>

      <span className="flex-1" />

      {/* A form post, so switching language works without JavaScript. */}
      <form action={setLanguage} className="flex items-center gap-0.5">
        <input type="hidden" name="lang" value={lang === "sq" ? "en" : "sq"} />
        <span className={langBtn(lang === "sq")}>sq</span>
        <span className="text-[12px] text-rule">/</span>
        <button type="submit" className={langBtn(lang === "en")}>
          {lang === "sq" ? "en" : "sq"}
        </button>
      </form>

      {user ? (
        <>
          <Link
            href="/favorites"
            className="hidden text-[13px] text-ink-mid no-underline hover:text-ink sm:block"
          >
            {t("navFavorites")}
          </Link>
          <Link href="/account" className="text-[13px] text-ink-mid no-underline hover:text-ink">
            {t("navMyListings")}
          </Link>
        </>
      ) : (
        <Link href="/login" className="text-[13px] text-ink-mid no-underline hover:text-ink">
          {t("navLogin")}
        </Link>
      )}

      <Link
        href="/listings/new"
        className="border-b border-cobalt pb-px text-[13px] text-ink no-underline"
      >
        {t("navPost")}
      </Link>
    </header>
  );
}

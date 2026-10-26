import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, IBM_Plex_Mono } from "next/font/google";
import { getLang, translator } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// latin-ext is not optional here: Albanian needs ë and ç, and roughly every
// second listing title contains one. Without the subset the display face falls
// back silently and the page looks broken on real content.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin", "latin-ext"],
  // 700 is carried for the "bold" direction, where Bodoni's thin strokes would
  // otherwise look spindly rather than emphatic.
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = translator(lang);
  return {
    title: { default: `${t("brand")} — ${t("tagline")}`, template: `%s · ${t("brand")}` },
    description: t("heroSubtitle"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();

  return (
    <html lang={lang}>
      <body
        className={`${archivo.variable} ${bodoni.variable} ${plexMono.variable}`}
      >
        <SiteHeader />
        <main className="mx-auto max-w-[1180px] px-[18px] pb-16">{children}</main>
        <footer className="border-t border-rule bg-paper">
          <div className="mx-auto max-w-[1180px] px-[18px] py-8">
            <p className="max-w-[70ch] text-[12px] leading-relaxed text-ink-mute">
              {lang === "sq"
                ? "Rent Finder është një platformë njoftimesh. Nuk jemi agjenci, nuk marrim komision dhe nuk jemi palë në asnjë kontratë qiraje."
                : "Rent Finder is a listings platform. We are not an agency, we take no commission, and we are not a party to any lease."}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

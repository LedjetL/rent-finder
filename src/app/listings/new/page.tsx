import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { LAYOUT_LABEL, LAYOUT_ORDER } from "@/lib/domain";
import { MAX_PHOTOS } from "@/lib/photos";
import { createListing } from "@/app/actions/listings";

export const metadata: Metadata = { title: "Shto njoftim" };

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/listings/new");

  const { lang, t } = await getT();
  const areas = await prisma.area.findMany({
    where: { city: { slug: "tirana" } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const today = new Date().toISOString().slice(0, 10);
  const failed = sp.error !== undefined;

  const check = (name: string, label: string, defaultChecked = false) => (
    <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-mid">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="h-[17px] w-[17px] accent-[var(--cobalt)]"
      />
      {label}
    </label>
  );

  return (
    <div className="pt-[26px]">
      <header className="border-b border-rule pb-5">
        <h1 className="display m-0 max-w-[14em] text-[clamp(30px,6vw,48px)]">
          {t("postTitle")}
        </h1>
        <p className="m-0 mt-3.5 max-w-[48ch] text-[15px] text-ink-mid">{t("postSubtitle")}</p>
      </header>

      {failed && (
        <p className="m-0 mt-5 border-l-2 border-ink bg-sunk px-3 py-2 text-[13px]">
          {t("required")}
        </p>
      )}

      {!user.phoneVerified && (
        <p className="m-0 mt-5 border-l-2 border-rule bg-sunk px-3 py-2.5 text-[13px] text-ink-mid">
          {lang === "sq"
            ? "Numri yt nuk është verifikuar ende, prandaj njoftimi do të shqyrtohet nga ne para se të publikohet."
            : "Your number isn't verified yet, so this listing will be reviewed by us before it goes live."}
        </p>
      )}

      <form action={createListing} className="max-w-[760px] pb-10">
        <input type="hidden" name="direction" value="OFFER" />

        {/* ── basics ── */}
        <h2 className="section-rule mt-8">{t("sectionBasics")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="propertyKind">{t("fType")}</label>
            <select id="propertyKind" name="propertyKind" required className="field" defaultValue="ROOM">
              <option value="ROOM">{t("fTypeRoom")}</option>
              <option value="WHOLE_UNIT">{t("fTypeApartment")}</option>
              <option value="SHORT_TERM">{t("fTypeSublet")}</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="layout">{t("fLayout")}</label>
            <select id="layout" name="layout" className="field" defaultValue="TWO_PLUS_ONE">
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
            placeholder={t("fieldTitleHint")} className="field !py-[11px] text-[15px]"
          />
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="description">{t("fieldDescription")}</label>
          <textarea
            id="description" name="description" required minLength={30} maxLength={4000} rows={6}
            className="field leading-relaxed"
          />
          <p className="m-0 mt-1.5 text-[12px] text-ink-mute">{t("fieldDescriptionHint")}</p>
        </div>

        {/* ── location ── */}
        <h2 className="section-rule mt-8">{t("sectionLocation")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="areaSlug">{t("fArea")}</label>
            <select id="areaSlug" name="areaSlug" required className="field">
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="addressHint">{t("fieldAddressHint")}</label>
            <input id="addressHint" name="addressHint" maxLength={120} className="field" />
          </div>
        </div>
        <p className="m-0 mt-2 max-w-[56ch] text-[12px] text-ink-mute">{t("locationNote")}</p>

        {/* ── price ── */}
        <h2 className="section-rule mt-8">{t("sectionPrice")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="priceAmount">{t("perMonth")}</label>
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
            <label className="field-label" htmlFor="depositMonths">
              {t("deposit")} · {t("months")}
            </label>
            <input
              id="depositMonths" name="depositMonths" type="number" min={0} max={6}
              defaultValue={1} className="field figure"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="utilitiesEur">
              {t("utilitiesExtra")} (€)
            </label>
            <input
              id="utilitiesEur" name="utilitiesEur" type="number" min={0} max={1000}
              className="field figure"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {check("utilitiesIncluded", t("utilitiesIncluded"))}
        </div>

        {/* Kept as an option rather than a default: most listings here come straight
            from the person living in the flat, and no agent brokers a spare room. */}
        <div className="mt-3 border-l-2 border-rule pl-3">
          {check("agencyFee", t("agencyFeeAsk"))}
          <p className="m-0 mt-1 max-w-[52ch] text-[12px] text-ink-mute">
            {t("agencyFeeAskHint")}
          </p>
        </div>

        <p className="m-0 mt-3 max-w-[56ch] text-[12px] text-ink-mute">{t("costNote")}</p>

        {/* ── details ── */}
        <h2 className="section-rule mt-8">{t("sectionDetails")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="sizeM2">{t("size")} (m²)</label>
            <input id="sizeM2" name="sizeM2" type="number" min={5} max={1000} className="field figure" />
          </div>
          <div>
            <label className="field-label" htmlFor="roomSizeM2">{t("roomSize")} (m²)</label>
            <input id="roomSizeM2" name="roomSizeM2" type="number" min={4} max={200} className="field figure" />
          </div>
          <div>
            <label className="field-label" htmlFor="floor">{t("floor")}</label>
            <input id="floor" name="floor" type="number" min={-2} max={60} className="field figure" />
          </div>
          <div>
            <label className="field-label" htmlFor="furnished">{t("furnishedLabel")}</label>
            <select id="furnished" name="furnished" className="field" defaultValue="FULL">
              <option value="FULL">{lang === "sq" ? "E mobiluar plotësisht" : "Fully furnished"}</option>
              <option value="PARTIAL">{lang === "sq" ? "Pjesërisht" : "Partly"}</option>
              <option value="NONE">{lang === "sq" ? "Pa mobilje" : "Unfurnished"}</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="heating">{t("heating")}</label>
            <select id="heating" name="heating" className="field" defaultValue="AC">
              <option value="AC">{lang === "sq" ? "Kondicioner" : "Air conditioning"}</option>
              <option value="CENTRAL">{lang === "sq" ? "Qendrore" : "Central"}</option>
              <option value="ELECTRIC">{lang === "sq" ? "Elektrike" : "Electric"}</option>
              <option value="WOOD">{lang === "sq" ? "Me dru" : "Wood"}</option>
              <option value="NONE">{lang === "sq" ? "Pa ngrohje" : "None"}</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="bathroom">
              {lang === "sq" ? "Tualeti" : "Bathroom"}
            </label>
            <select id="bathroom" name="bathroom" className="field" defaultValue="SHARED">
              <option value="SHARED">{t("bathShared")}</option>
              <option value="PRIVATE">{t("bathPrivate")}</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {check("hasElevator", t("elevator"))}
          {check("balcony", t("fBalcony"))}
          {check("washingMachine", t("fWasher"))}
          {check("parking", t("fParking"))}
          {check("internet", "Internet", true)}
          {check("petsAllowed", t("fPets"))}
          {check("smokingAllowed", lang === "sq" ? "Lejohet duhani" : "Smoking allowed")}
        </div>

        {/* ── flatmates ── */}
        <h2 className="section-rule mt-8">{t("sectionFlatmates")}</h2>
        <p className="m-0 mt-2 max-w-[56ch] text-[12px] text-ink-mute">
          {lang === "sq"
            ? "Vlen vetëm për dhoma në apartament të përbashkët."
            : "Applies only to a room in a shared flat."}
        </p>
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="flatmatesTotal">{t("flatmates")}</label>
            <input
              id="flatmatesTotal" name="flatmatesTotal" type="number" min={0} max={12}
              className="field figure"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="wantedGender">{t("lookingFor")}</label>
            <select id="wantedGender" name="wantedGender" className="field" defaultValue="ANY">
              <option value="ANY">{lang === "sq" ? "S'ka rëndësi" : "No preference"}</option>
              <option value="FEMALE">{lang === "sq" ? "Vajza" : "Women"}</option>
              <option value="MALE">{lang === "sq" ? "Djem" : "Men"}</option>
            </select>
            <p className="m-0 mt-1.5 max-w-[40ch] text-[11px] leading-snug text-ink-mute">
              {lang === "sq"
                ? "Preferenca e gjinisë lejohet vetëm për dhoma ku banon edhe vetë pronari."
                : "A gender preference is only permitted for a room in a home you live in yourself."}
            </p>
          </div>
        </div>

        {/* ── photos ── */}
        <h2 className="section-rule mt-8">{t("sectionPhotos")}</h2>
        <p className="m-0 mt-2 max-w-[56ch] text-[13px] text-ink-mid">
          {lang === "sq"
            ? "Njoftimet me foto të ndritshme marrin shumë më shumë mesazhe. Hap dritaret, ndiz dritat, fotografo ditën."
            : "Listings with bright photos get far more messages. Open the curtains, put the lights on, shoot in daylight."}
        </p>
        <div className="mt-3">
          <label className="field-label" htmlFor="photos">
            {t("sectionPhotos")} · {lang === "sq" ? "deri në" : "up to"} {MAX_PHOTOS}
          </label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="field file:mr-3 file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-[13px] file:text-plaster"
          />
          <p className="m-0 mt-1.5 text-[12px] text-ink-mute">
            JPEG, PNG, WEBP, AVIF · {lang === "sq" ? "maks." : "max"} 12 MB
            {lang === "sq"
              ? ". Fotot ripërmasohen automatikisht."
              : ". Photos are resized automatically."}
          </p>
        </div>

        {/* ── availability ── */}
        <h2 className="section-rule mt-8">{t("sectionAvailability")}</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-4">
          <div>
            <label className="field-label" htmlFor="availableFrom">{t("availableFrom")}</label>
            <input
              id="availableFrom" name="availableFrom" type="date" required
              defaultValue={today} className="field figure"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="minStayMonths">{t("minStay")}</label>
            <input
              id="minStayMonths" name="minStayMonths" type="number" min={1} max={60}
              defaultValue={6} className="field figure"
            />
          </div>
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

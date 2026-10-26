/**
 * Tirana geography — the seed data behind the City and Area tables.
 *
 * Renting in Tirana is negotiated by *zone*, not by street address: listings say
 * "Astir" or "te Komuna e Parisit", never a postcode. So the zone is the primary
 * search axis and every OFFER listing snaps to one.
 *
 * `aliases` is the part that matters most. Tirana is navigated by landmark, and a
 * great many zone names are literally "te X" — at the X. Search has to match those,
 * and it has to match them typed without diacritics, because almost nobody types
 * ë or ç into a search box.
 */

export type NeighborhoodSeed = {
  slug: string;
  /** Formal name, correctly accented. */
  name: string;
  /** English gloss, only where one is genuinely used. */
  nameEn: string;
  /** What people actually say and type, including unaccented spellings. */
  aliases: string[];
  lat: number;
  lng: number;
  blurbSq: string;
  blurbEn: string;
};

export const NEIGHBORHOODS: NeighborhoodSeed[] = [
  {
    slug: "blloku",
    name: "Blloku",
    nameEn: "Blloku",
    aliases: ["Ish-Blloku", "te Blloku", "Bllok", "Ish Blloku"],
    lat: 41.3197,
    lng: 19.8189,
    blurbSq: "Zona më e shtrenjtë, plot lokale dhe kafene. Ecën në këmbë kudo.",
    blurbEn: "The priciest zone — bars, cafés, nightlife. Everything on foot.",
  },
  {
    slug: "qendra",
    name: "Qendra",
    nameEn: "City Centre",
    aliases: ["Qender", "Qendër", "te Sheshi", "Sheshi Skenderbej", "Center"],
    lat: 41.3275,
    lng: 19.8189,
    blurbSq: "Sheshi Skënderbej dhe rreth tij. Ndërtesa të vjetra, qira e lartë.",
    blurbEn: "Skanderbeg Square and around. Older buildings, high rent.",
  },
  {
    slug: "komuna-e-parisit",
    name: "Komuna e Parisit",
    nameEn: "Komuna e Parisit",
    aliases: ["te Komuna", "Komuna", "KP", "Komuna e Parisit"],
    lat: 41.3136,
    lng: 19.8103,
    blurbSq: "E qetë dhe e kërkuar, afër Bllokut por më e lirë.",
    blurbEn: "Quiet and in demand, next to Blloku but cheaper.",
  },
  {
    slug: "myslym-shyri",
    name: "Myslym Shyri",
    nameEn: "Myslym Shyri",
    aliases: ["te Myslymi", "Myslymi", "Muslym Shyri"],
    lat: 41.3241,
    lng: 19.8115,
    blurbSq: "Rrugë qendrore me dyqane, ndërtesa të viteve '60-'80.",
    blurbEn: "Central shopping street, mostly 60s–80s blocks.",
  },
  {
    slug: "rruga-e-kavajes",
    name: "Rruga e Kavajës",
    nameEn: "Rruga e Kavajës",
    aliases: ["Rruga e Kavajes", "te Kavaja", "Kavaja"],
    lat: 41.3268,
    lng: 19.802,
    blurbSq: "Arterie kryesore, transport i mirë, çmime mesatare.",
    blurbEn: "Main artery, good transport links, mid-range prices.",
  },
  {
    slug: "21-dhjetori",
    name: "21 Dhjetori",
    nameEn: "21 Dhjetori",
    aliases: ["te 21-shi", "21 shi", "Njezetenjeshi", "21 Dhjetori"],
    lat: 41.329,
    lng: 19.796,
    blurbSq: "Zonë banimi e dendur, e përshtatshme për studentë.",
    blurbEn: "Dense residential area, popular with students.",
  },
  {
    slug: "don-bosko",
    name: "Don Bosko",
    nameEn: "Don Bosko",
    aliases: ["te Don Bosko", "Bosko", "Donbosko"],
    lat: 41.341,
    lng: 19.796,
    blurbSq: "Ndërtesa të reja, familje të reja, çmime të arsyeshme.",
    blurbEn: "Newer buildings, young families, reasonable prices.",
  },
  {
    slug: "laprake",
    name: "Laprakë",
    nameEn: "Laprakë",
    aliases: ["Laprake", "te Lapraka", "Lapraka"],
    lat: 41.343,
    lng: 19.79,
    blurbSq: "Në veri-perëndim, qira e lirë, larg qendrës.",
    blurbEn: "North-west, cheap rent, further from the centre.",
  },
  {
    slug: "astir",
    name: "Astir",
    nameEn: "Astir",
    aliases: ["te Astiri", "Astiri", "Ast ir"],
    lat: 41.323,
    lng: 19.772,
    blurbSq: "Zonë e re me shumë pallate, shumë e kërkuar nga të rinjtë.",
    blurbEn: "Newer high-rise zone, very popular with young renters.",
  },
  {
    slug: "unaza-e-re",
    name: "Unaza e Re",
    nameEn: "New Ring Road",
    aliases: ["te Unaza", "Unaza e Re", "Unaza"],
    lat: 41.32,
    lng: 19.78,
    blurbSq: "Ndërtime të reja përgjatë unazës, apartamente moderne.",
    blurbEn: "New construction along the ring road, modern flats.",
  },
  {
    slug: "yzberisht",
    name: "Yzberisht",
    nameEn: "Yzberisht",
    aliases: ["te Yzberishti", "Yzberishti", "Izberisht"],
    lat: 41.318,
    lng: 19.762,
    blurbSq: "Periferi perëndimore, ndër më të lirat për apartamente të reja.",
    blurbEn: "Western edge — among the cheapest for newly built flats.",
  },
  {
    slug: "kombinat",
    name: "Kombinat",
    nameEn: "Kombinat",
    aliases: ["te Kombinati", "Kombinati"],
    lat: 41.313,
    lng: 19.77,
    blurbSq: "Zonë tradicionale pune, qira e lirë, komunitet i ngushtë.",
    blurbEn: "Traditional working district, cheap rent, tight community.",
  },
  {
    slug: "selita",
    name: "Selitë",
    nameEn: "Selitë",
    aliases: ["Selite", "te Selita", "Selita"],
    lat: 41.311,
    lng: 19.809,
    blurbSq: "Mes Bllokut dhe Liqenit, e qetë dhe e gjelbër.",
    blurbEn: "Between Blloku and the lake — quiet and green.",
  },
  {
    slug: "liqeni-i-thate",
    name: "Liqeni i Thatë",
    nameEn: "Dry Lake",
    aliases: ["Liqeni i Thate", "te Liqeni", "Dry Lake", "Liqeni"],
    lat: 41.308,
    lng: 19.825,
    blurbSq: "Pranë Parkut të Madh, e preferuar nga të huajt.",
    blurbEn: "By the Grand Park, a favourite with expats.",
  },
  {
    slug: "qyteti-studenti",
    name: "Qyteti Studenti",
    nameEn: "Student City",
    aliases: ["Studenti", "te Studenti", "Student City", "Qyteti Studenti"],
    lat: 41.314,
    lng: 19.828,
    blurbSq: "Zemra studentore e Tiranës, plot bashkëbanues.",
    blurbEn: "Tirana's student heart — flatshares everywhere.",
  },
  {
    slug: "ali-demi",
    name: "Ali Demi",
    nameEn: "Ali Demi",
    aliases: ["te Ali Demi", "Alidemi"],
    lat: 41.332,
    lng: 19.839,
    blurbSq: "Lindje e qendrës, çmime mesatare, transport i mirë.",
    blurbEn: "East of centre, mid prices, well connected.",
  },
  {
    slug: "rruga-e-dibres",
    name: "Rruga e Dibrës",
    nameEn: "Rruga e Dibrës",
    aliases: ["Rruga e Dibres", "te Dibra", "Dibra"],
    lat: 41.34,
    lng: 19.828,
    blurbSq: "Afër spitaleve dhe Universitetit të Mjekësisë.",
    blurbEn: "Near the hospitals and the Medical University.",
  },
  {
    slug: "zogu-i-zi",
    name: "Zogu i Zi",
    nameEn: "Zogu i Zi",
    aliases: ["te Zogu i Zi", "Zogu i zi", "Zogu"],
    lat: 41.3352,
    lng: 19.8085,
    blurbSq: "Nyje transporti, qendrore dhe e lidhur mirë.",
    blurbEn: "Transit hub — central and very well connected.",
  },
  {
    slug: "xhamlliku",
    name: "Xhamllik",
    nameEn: "Xhamllik",
    aliases: ["te Xhamlliku", "Xhamlliku", "Xhamllik"],
    lat: 41.3348,
    lng: 19.8452,
    blurbSq: "Lindje, banim i qetë, çmime të arsyeshme.",
    blurbEn: "East side, quiet residential, reasonable prices.",
  },
  {
    slug: "medreseja",
    name: "Medreseja",
    nameEn: "Medreseja",
    aliases: ["te Medreseja", "Medrese"],
    lat: 41.3382,
    lng: 19.8235,
    blurbSq: "Veri-qendër, afër Rrugës së Dibrës.",
    blurbEn: "North-central, just off Rruga e Dibrës.",
  },
  {
    slug: "pazari-i-ri",
    name: "Pazari i Ri",
    nameEn: "New Bazaar",
    aliases: ["te Pazari", "Pazari i Ri", "Pazari"],
    lat: 41.3288,
    lng: 19.8248,
    blurbSq: "Qendrore, e rinovuar, plot restorante.",
    blurbEn: "Central, regenerated, full of restaurants.",
  },
  {
    slug: "rruga-e-elbasanit",
    name: "Rruga e Elbasanit",
    nameEn: "Rruga e Elbasanit",
    aliases: ["Rruga e Elbasanit", "te Elbasani", "Elbasani"],
    lat: 41.3125,
    lng: 19.8285,
    blurbSq: "Afër universiteteve dhe Parkut të Madh.",
    blurbEn: "Near the universities and the Grand Park.",
  },
  {
    slug: "tirana-e-re",
    name: "Tirana e Re",
    nameEn: "Tirana e Re",
    aliases: ["te Tirana e Re", "Tirana e re"],
    lat: 41.32,
    lng: 19.808,
    blurbSq: "Qendrore dhe e qetë, e kërkuar nga profesionistët.",
    blurbEn: "Central but calm, popular with professionals.",
  },
  {
    slug: "porcelan",
    name: "Porcelan",
    nameEn: "Porcelan",
    aliases: ["te Porcelani", "Porcelani"],
    lat: 41.335,
    lng: 19.81,
    blurbSq: "Afër qendrës, ndërtesa të përziera, çmime të mira.",
    blurbEn: "Close to centre, mixed housing stock, good value.",
  },
  {
    slug: "vasil-shanto",
    name: "Vasil Shanto",
    nameEn: "Vasil Shanto",
    aliases: ["te Vasil Shanto", "Vasil Shanto"],
    lat: 41.339,
    lng: 19.818,
    blurbSq: "Zonë banimi veriore, e qetë.",
    blurbEn: "Northern residential pocket, quiet.",
  },
  {
    slug: "kinostudio",
    name: "Kinostudio",
    nameEn: "Kinostudio",
    aliases: ["te Kinostudio", "Kinostudioja"],
    lat: 41.341,
    lng: 19.842,
    blurbSq: "Zonë e qetë banimi në verilindje.",
    blurbEn: "Quiet residential pocket in the north-east.",
  },
  {
    slug: "fresku",
    name: "Fresku",
    nameEn: "Fresku",
    aliases: ["te Fresku", "Freskia"],
    lat: 41.333,
    lng: 19.856,
    blurbSq: "Kodrinore, ajër i pastër, larg zhurmës.",
    blurbEn: "Hillside, fresh air, away from the noise.",
  },
  {
    slug: "bregu-i-lumit",
    name: "Bregu i Lumit",
    nameEn: "Bregu i Lumit",
    aliases: ["te Bregu i Lumit", "Bregu"],
    lat: 41.3455,
    lng: 19.8365,
    blurbSq: "Verilindje, qira të lira.",
    blurbEn: "North-east, cheap rent.",
  },
  {
    slug: "sauk",
    name: "Sauk",
    nameEn: "Sauk",
    aliases: ["te Sauku", "Sauku"],
    lat: 41.298,
    lng: 19.834,
    blurbSq: "Kodrinore në jug, vila dhe apartamente të reja.",
    blurbEn: "Hilly southern edge — villas and new-build flats.",
  },
  {
    slug: "farke",
    name: "Farkë",
    nameEn: "Farkë",
    aliases: ["Farke", "Farka", "te Farka"],
    lat: 41.29,
    lng: 19.85,
    blurbSq: "Jashtë qytetit, e qetë, nevojitet makinë.",
    blurbEn: "Out of town, peaceful, you'll want a car.",
  },
  {
    slug: "paskuqan",
    name: "Paskuqan",
    nameEn: "Paskuqan",
    aliases: ["te Paskuqani", "Paskuqani"],
    lat: 41.36,
    lng: 19.78,
    blurbSq: "Periferi veriore, ndër qiratë më të lira.",
    blurbEn: "Northern periphery, some of the cheapest rent around.",
  },
  {
    slug: "kashar",
    name: "Kashar",
    nameEn: "Kashar",
    aliases: ["te Kashari", "Kashari"],
    lat: 41.335,
    lng: 19.72,
    blurbSq: "Drejt Durrësit, zonë industriale dhe banesa të reja.",
    blurbEn: "Toward Durrës — industrial belt plus new housing.",
  },
];

/** Geographic centre of Tirana — the default map view. */
export const TIRANA_CENTER = { lat: 41.3275, lng: 19.8187 };

/**
 * Universities. A large share of demand searches by "how far from my faculty"
 * rather than by zone, so campuses are a first-class filter axis.
 */
export type Campus = {
  slug: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
};

export const CAMPUSES: Campus[] = [
  { slug: "ut", name: "Universiteti i Tiranës", shortName: "UT", lat: 41.3183, lng: 19.8206 },
  { slug: "upt", name: "Universiteti Politeknik i Tiranës", shortName: "UPT", lat: 41.321, lng: 19.823 },
  { slug: "umt", name: "Universiteti i Mjekësisë", shortName: "UMT", lat: 41.323, lng: 19.828 },
  { slug: "uet", name: "Universiteti Europian i Tiranës", shortName: "UET", lat: 41.312, lng: 19.806 },
  { slug: "polis", name: "POLIS University", shortName: "POLIS", lat: 41.36, lng: 19.73 },
  { slug: "epoka", name: "Epoka University", shortName: "Epoka", lat: 41.397, lng: 19.705 },
  { slug: "ubt", name: "Universiteti Bujqësor i Tiranës", shortName: "UBT", lat: 41.383, lng: 19.718 },
];

/** Straight-line distance in km. Enough for a "20 min walk" style hint. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Walking minutes at 4.5 km/h with a 1.3x detour factor for real streets. */
export function walkMinutes(km: number): number {
  return Math.round(((km * 1.3) / 4.5) * 60);
}

/**
 * Strip Albanian diacritics for comparison. The database does this with the
 * rf_unaccent() wrapper; this is the same normalisation in application code, used
 * when matching typed input against zone aliases.
 */
export function unaccent(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

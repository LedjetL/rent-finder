import { cookies } from "next/headers";
import type { Lang } from "./domain";
import type {
  BathroomType,
  Furnished,
  GenderPref,
  Heating,
  PropertyKind,
} from "@/generated/prisma/enums";

// Re-exported so components that already import `T` from here get `Lang` too.
export type { Lang };

/**
 * Bilingual copy, Albanian first.
 *
 * Albanian is the default because the site is for Tirana; English is a first-class
 * switch, not an afterthought, because Erasmus students and nomads are half the demand.
 * The dictionary is a plain object so `en` is type-checked against `sq` — a missing
 * translation is a compile error, not a silently English string on an Albanian page.
 */

export const LANG_COOKIE = "rf_lang";

const sq = {
  // ── chrome ────────────────────────────────────────────────────────────────
  brand: "Rent Finder Tirana",
  tagline: "Dhoma dhe apartamente me qira në Tiranë — pa agjentë, pa mashtrime",
  navSearch: "Kërko",
  navSeekers: "Kërkues",
  navPost: "Shto njoftim",
  navMessages: "Mesazhet",
  navFavorites: "Të preferuarat",
  navLogin: "Hyr",
  navRegister: "Regjistrohu",
  navLogout: "Dil",
  navProfile: "Profili im",
  navMyListings: "Njoftimet e mia",

  // ── home ──────────────────────────────────────────────────────────────────
  heroTitle: "Gjej dhomën tënde në Tiranë",
  heroSubtitle:
    "Njoftime direkt nga banorët dhe pronarët. Çmimi i plotë që në fillim — qira, depozitë dhe komision.",
  heroSearchPlaceholder: "Zona, p.sh. Blloku ose Astir",
  heroCta: "Kërko",
  heroSecondaryCta: "Po jap me qira",
  browseByArea: "Shfleto sipas zonës",
  browseByCampus: "Afër universitetit",
  latestListings: "Njoftimet më të fundit",
  seeAll: "Shiko të gjitha",
  howItWorks: "Si funksionon",
  step1Title: "Kërko me filtra realë",
  step1Body: "Zonë, çmim, 1+1 apo dhomë më vete, data e lirimit. Pa njoftime të dyfishta.",
  step2Title: "Shkruaj direkt",
  step2Body: "Mesazhe brenda faqes. Nuk ke nevojë të japësh numrin derisa të vendosësh.",
  step3Title: "Shiko koston e vërtetë",
  step3Body: "Llogarisim qira + depozitë + komision, që të mos ketë surpriza te noteri.",

  // ── search ────────────────────────────────────────────────────────────────
  filters: "Filtra",
  applyFilters: "Apliko",
  clearFilters: "Pastro",
  resultsCount: "njoftime",
  noResults: "Nuk u gjet asnjë njoftim",
  noResultsHint: "Provo të zgjerosh zonën ose të rritësh buxhetin.",
  sortBy: "Rendit sipas",
  sortNewest: "Më të rejat",
  sortPriceAsc: "Çmimi: nga i ulëti",
  sortPriceDesc: "Çmimi: nga i larti",
  sortSizeDesc: "Sipërfaqja: nga më e madhja",
  showMap: "Harta",
  showList: "Lista",

  // ── filter labels ─────────────────────────────────────────────────────────
  fType: "Lloji",
  fTypeRoom: "Dhomë në apartament",
  fTypeApartment: "Apartament i plotë",
  fTypeSublet: "Qira e përkohshme",
  fArea: "Zona",
  fAnyArea: "Të gjitha zonat",
  fPriceMin: "Çmimi min (€)",
  fPriceMax: "Çmimi max (€)",
  fLayout: "Struktura",
  fAnyLayout: "Çdo strukturë",
  fFrom: "I lirë nga",
  fFurnished: "E mobiluar",
  fCampus: "Afër universitetit",
  fAnyCampus: "Çdo universitet",
  fMaxWalk: "Deri në (minuta në këmbë)",
  fAmenities: "Të tjera",
  fNoAgencyFee: "Pa komision agjencie",
  fPets: "Lejohen kafshët",
  fParking: "Parkim",
  fBalcony: "Ballkon",
  fWasher: "Lavatriçe",

  // ── listing card / detail ─────────────────────────────────────────────────
  perMonth: "/muaj",
  utilitiesIncluded: "Faturat përfshihen",
  utilitiesExtra: "Faturat veç",
  deposit: "Depozita",
  agencyFee: "Komisioni i agjencisë",
  noAgencyFee: "Pa komision",
  months: "muaj",
  moveInCost: "Kosto në fillim",
  moveInCostHelp: "Qira e muajit të parë + depozita + komisioni",
  availableFrom: "I lirë nga",
  availableUntil: "Deri më",
  openEnded: "Pa afat",
  minStay: "Qëndrimi minimal",
  size: "Sipërfaqja",
  roomSize: "Dhoma",
  floor: "Kati",
  elevator: "Ashensor",
  heating: "Ngrohja",
  furnishedLabel: "Mobilimi",
  flatmates: "Bashkëbanues",
  lookingFor: "Kërkohet",
  amenities: "Komoditete",
  description: "Përshkrimi",
  location: "Vendndodhja",
  locationNote:
    "Pika në hartë është e përafërt. Adresa e saktë jepet nga pronari në bisedë.",
  contactOwner: "Kontakto",
  messagePlaceholder: "Përshëndetje, jam i interesuar për këtë njoftim…",
  sendMessage: "Dërgo",
  save: "Ruaj",
  saved: "E ruajtur",
  share: "Shpërnda",
  report: "Raporto",
  postedBy: "Publikuar nga",
  memberSince: "Anëtar që nga",
  views: "shikime",
  rentedBanner: "Ky njoftim është dhënë me qira.",
  walkTo: "në këmbë deri te",

  // ── post listing ──────────────────────────────────────────────────────────
  postTitle: "Shto njoftimin tënd",
  postSubtitle: "Falas. Zgjat rreth 3 minuta.",
  sectionBasics: "Të dhënat bazë",
  sectionLocation: "Vendndodhja",
  sectionPrice: "Çmimi",
  sectionDetails: "Detajet",
  sectionFlatmates: "Bashkëbanuesit",
  sectionAvailability: "Disponueshmëria",
  sectionPhotos: "Fotot",
  fieldTitle: "Titulli",
  fieldTitleHint: "P.sh. “Dhomë me ballkon në Komunë e Parisit”",
  fieldDescription: "Përshkrimi",
  fieldDescriptionHint:
    "Shkruaj për dhomën, bashkëbanuesit dhe lagjen. Njoftimet e detajuara marrin 3x më shumë mesazhe.",
  fieldAddressHint: "Referencë (rrugë ose pikë orientuese)",
  fieldPinHint: "Kliko në hartë për të vendosur pikën",
  publish: "Publiko njoftimin",
  publishing: "Duke publikuar…",

  // ── seekers ───────────────────────────────────────────────────────────────
  seekersTitle: "Njerëz që kërkojnë shtëpi",
  seekersSubtitle:
    "Je pronar? Shfleto kërkuesit dhe shkruaji direkt personit që të duket i përshtatshëm.",
  seekerBudget: "Buxheti",
  seekerMoveIn: "Zhvendoset më",
  seekerAreas: "Zonat e preferuara",
  seekerAnywhere: "Kudo në Tiranë",
  createSeekerProfile: "Krijo profilin e kërkuesit",
  editSeekerProfile: "Ndrysho profilin",
  seekerOccupation: "Profesioni / studimet",
  seekerStay: "Kohëzgjatja",

  // ── messages ──────────────────────────────────────────────────────────────
  messagesTitle: "Mesazhet",
  noConversations: "Ende asnjë bisedë.",
  noConversationsHint: "Kur t'i shkruash një pronari, biseda shfaqet këtu.",
  typeMessage: "Shkruaj një mesazh…",
  send: "Dërgo",
  about: "Rreth",

  // ── favorites ─────────────────────────────────────────────────────────────
  favoritesTitle: "Të preferuarat",
  noFavorites: "Nuk ke ruajtur ende asnjë njoftim.",

  // ── auth ──────────────────────────────────────────────────────────────────
  loginTitle: "Hyr në llogari",
  registerTitle: "Krijo llogari",
  email: "Email",
  password: "Fjalëkalimi",
  name: "Emri",
  phone: "Telefoni",
  phoneOptional: "Telefoni (opsional)",
  submitLogin: "Hyr",
  submitRegister: "Regjistrohu",
  noAccount: "Nuk ke llogari?",
  haveAccount: "Ke llogari?",
  authError: "Email ose fjalëkalim i pasaktë.",
  emailTaken: "Ky email është përdorur tashmë.",

  // ── trust ─────────────────────────────────────────────────────────────────
  trustTitle: "Kujdes nga mashtrimet",
  trustBody:
    "Mos dërgo kurrë para para se ta shohësh banesën nga afër. Askush serioz nuk kërkon depozitë përmes Western Union apo kriptomonedhave.",
  reportTitle: "Raporto këtë njoftim",
  reportReason: "Arsyeja",
  reportDetail: "Detaje (opsionale)",
  reportSubmit: "Dërgo raportin",
  reportThanks: "Faleminderit. Do ta shqyrtojmë.",
  reasonSCAM: "Mashtrim",
  reasonWRONG_PRICE: "Çmimi i gabuar",
  reasonALREADY_RENTED: "Është dhënë tashmë",
  reasonAGENCY_POSING: "Agjenci që shtiret si pronar",
  reasonOTHER: "Tjetër",

  // ── card & detail ─────────────────────────────────────────────────────────
  bathPrivate: "Tualet privat",
  bathShared: "Tualet i përbashkët",
  phoneVerified: "Telefon i verifikuar",
  metInPerson: "Takuar personalisht",
  upfront: "në fillim",
  resultsFound: "njoftime",
  anyKind: "Të gjitha llojet",
  prev: "Më parë",
  next: "Më pas",
  pageOf: "nga",
  contactShow: "Shfaq kontaktin",
  contactWhatsapp: "Shkruaj në WhatsApp",
  loginToContact: "Hyr për të parë kontaktin",
  contactNote:
    "Kontakti hapet në WhatsApp. Numri yt nuk i jepet askujt pa lejen tënde.",
  aboutLister: "Rreth pronarit",
  flatmatesCount: "bashkëbanues",
  savingVsAgency: "Kursen ndaj agjencisë",
  savingExplain:
    "Agjencitë në Tiranë i marrin qiramarrësit rreth gjysmën e qirasë së muajit të parë. Këtu nuk ka komision.",
  costBreakdown: "Si llogaritet",
  firstMonth: "Qiraja e muajit të parë",
  commission: "Komisioni i agjencisë",
  totalUpfront: "Totali në fillim",
  seekerLooking: "Kërkon",
  seekerBudgetUpTo: "Deri në",
  noZonePref: "Kudo në Tiranë",
  depositShort: "depozitë",
  commissionShort: "komision",
  refundable: "e kthyeshme",
  refundableNote: "Depozita të kthehet kur largohesh, nëse banesa lihet në rregull.",
  notRecovered: "nuk kthehet",
  cashOnTheDay: "Para në dorë ditën e nënshkrimit",
  sortUpfront: "Kosto në fillim",
  costNote:
    "Qiraja e muajit të parë, depozita dhe komisioni i agjencisë, të mbledhura. Kjo është shuma që jep ditën e nënshkrimit.",
  noCommissionNote:
    "Direkt nga banori. Pa agjent dhe pa komision — dhe ne nuk marrim kurrë asgjë.",
  withCommissionNote:
    "Ky komision shkon te agjenti i pronarit, jo te ne. Ne nuk marrim komision, kurrë.",
  // ── rent check ────────────────────────────────────────────────────────────
  checkTitle: "A po paguan shumë?",
  checkSub:
    "Shkruaj sa paguan tani dhe shiko ku bie krahasuar me pjesën tjetër të Tiranës. Zgjat 10 sekonda.",
  checkYourRent: "Sa paguan në muaj?",
  checkCta: "Kontrollo qiranë",
  checkAgain: "Provo përsëri",
  verdictOver: "Po paguan mbi treg",
  verdictUnder: "Je nën treg",
  verdictFair: "Je në mes të tregut",
  verdictOverBody: "më shumë se sa paguan mesatarja për të njëjtën gjë.",
  verdictUnderBody: "më pak se sa paguan mesatarja për të njëjtën gjë.",
  verdictFairBody: "Çmimi yt është aty ku pritet për këtë zonë.",
  checkBasedOn: "bazuar në",
  checkListingsWord: "njoftime aktive",
  checkCityWide:
    "Nuk ka ende mjaft njoftime në këtë zonë, prandaj krahasimi është me gjithë Tiranën.",
  checkThinData:
    "Sa më shumë njerëz ta kontrollojnë, aq më i saktë bëhet ky numër.",
  checkMedianLabel: "Mesatarja",
  checkYouLabel: "Ti",
  checkSeeCheaper: "Shiko njoftimet nën këtë çmim",
  noDepositNote: "Pa depozitë. Paguan vetëm qiranë e muajit të parë.",
  agencyFeeAsk: "Ka agjent që i merr komision qiramarrësit?",
  agencyFeeAskHint:
    "Lëre bosh nëse e jep vetë shtëpinë. Shumica e njoftimeve këtu janë direkt nga banorët.",

  // ── misc ──────────────────────────────────────────────────────────────────
  yes: "Po",
  no: "Jo",
  cancel: "Anulo",
  loading: "Duke u ngarkuar…",
  required: "Kjo fushë është e detyrueshme",
  backToSearch: "Kthehu te kërkimi",
} as const;

/** English must cover exactly the same keys — enforced by the type below. */
const en: Record<keyof typeof sq, string> = {
  brand: "Rent Finder Tirana",
  tagline: "Rooms and flats to rent in Tirana — no agents, no scams",
  navSearch: "Search",
  navSeekers: "Seekers",
  navPost: "Post a listing",
  navMessages: "Messages",
  navFavorites: "Saved",
  navLogin: "Log in",
  navRegister: "Sign up",
  navLogout: "Log out",
  navProfile: "My profile",
  navMyListings: "My listings",

  heroTitle: "Find your room in Tirana",
  heroSubtitle:
    "Listings straight from the people living there. The full price up front — rent, deposit and commission.",
  heroSearchPlaceholder: "Area, e.g. Blloku or Astir",
  heroCta: "Search",
  heroSecondaryCta: "I'm letting a place",
  browseByArea: "Browse by area",
  browseByCampus: "Near your university",
  latestListings: "Newest listings",
  seeAll: "See all",
  howItWorks: "How it works",
  step1Title: "Search with filters that matter",
  step1Body: "Area, price, 1+1 or a private room, move-in date. No duplicate posts.",
  step2Title: "Message directly",
  step2Body: "Chat on-site. You don't hand over your number until you want to.",
  step3Title: "See the real cost",
  step3Body:
    "We add up rent + deposit + agency fee, so there's no surprise at the notary.",

  filters: "Filters",
  applyFilters: "Apply",
  clearFilters: "Clear",
  resultsCount: "listings",
  noResults: "No listings found",
  noResultsHint: "Try widening the area or raising your budget.",
  sortBy: "Sort by",
  sortNewest: "Newest",
  sortPriceAsc: "Price: low to high",
  sortPriceDesc: "Price: high to low",
  sortSizeDesc: "Size: largest first",
  showMap: "Map",
  showList: "List",

  fType: "Type",
  fTypeRoom: "Room in a shared flat",
  fTypeApartment: "Whole apartment",
  fTypeSublet: "Temporary sublet",
  fArea: "Area",
  fAnyArea: "All areas",
  fPriceMin: "Min price (€)",
  fPriceMax: "Max price (€)",
  fLayout: "Layout",
  fAnyLayout: "Any layout",
  fFrom: "Available from",
  fFurnished: "Furnished",
  fCampus: "Near university",
  fAnyCampus: "Any university",
  fMaxWalk: "Within (minutes on foot)",
  fAmenities: "Extras",
  fNoAgencyFee: "No agency fee",
  fPets: "Pets allowed",
  fParking: "Parking",
  fBalcony: "Balcony",
  fWasher: "Washing machine",

  perMonth: "/month",
  utilitiesIncluded: "Bills included",
  utilitiesExtra: "Bills on top",
  deposit: "Deposit",
  agencyFee: "Agency fee",
  noAgencyFee: "No agency fee",
  months: "months",
  moveInCost: "Cost to move in",
  moveInCostHelp: "First month's rent + deposit + agency fee",
  availableFrom: "Available from",
  availableUntil: "Until",
  openEnded: "Open-ended",
  minStay: "Minimum stay",
  size: "Size",
  roomSize: "Room",
  floor: "Floor",
  elevator: "Lift",
  heating: "Heating",
  furnishedLabel: "Furnishing",
  flatmates: "Flatmates",
  lookingFor: "Looking for",
  amenities: "Amenities",
  description: "Description",
  location: "Location",
  locationNote:
    "The map pin is approximate. The owner shares the exact address in chat.",
  contactOwner: "Contact",
  messagePlaceholder: "Hi, I'm interested in this listing…",
  sendMessage: "Send",
  save: "Save",
  saved: "Saved",
  share: "Share",
  report: "Report",
  postedBy: "Posted by",
  memberSince: "Member since",
  views: "views",
  rentedBanner: "This place has already been rented.",
  walkTo: "on foot to",

  postTitle: "Post your listing",
  postSubtitle: "Free. Takes about 3 minutes.",
  sectionBasics: "Basics",
  sectionLocation: "Location",
  sectionPrice: "Price",
  sectionDetails: "Details",
  sectionFlatmates: "Flatmates",
  sectionAvailability: "Availability",
  sectionPhotos: "Photos",
  fieldTitle: "Title",
  fieldTitleHint: "e.g. “Room with balcony in Komuna e Parisit”",
  fieldDescription: "Description",
  fieldDescriptionHint:
    "Describe the room, the flatmates and the neighbourhood. Detailed listings get 3x more messages.",
  fieldAddressHint: "Nearby street or landmark",
  fieldPinHint: "Click the map to place the pin",
  publish: "Publish listing",
  publishing: "Publishing…",

  seekersTitle: "People looking for a place",
  seekersSubtitle:
    "Letting a room? Browse seekers and message whoever looks like a good fit.",
  seekerBudget: "Budget",
  seekerMoveIn: "Moving in",
  seekerAreas: "Preferred areas",
  seekerAnywhere: "Anywhere in Tirana",
  createSeekerProfile: "Create seeker profile",
  editSeekerProfile: "Edit profile",
  seekerOccupation: "Work / studies",
  seekerStay: "Length of stay",

  messagesTitle: "Messages",
  noConversations: "No conversations yet.",
  noConversationsHint: "Once you message an owner, the thread shows up here.",
  typeMessage: "Write a message…",
  send: "Send",
  about: "About",

  favoritesTitle: "Saved listings",
  noFavorites: "You haven't saved any listings yet.",

  loginTitle: "Log in",
  registerTitle: "Create an account",
  email: "Email",
  password: "Password",
  name: "Name",
  phone: "Phone",
  phoneOptional: "Phone (optional)",
  submitLogin: "Log in",
  submitRegister: "Sign up",
  noAccount: "No account yet?",
  haveAccount: "Already have an account?",
  authError: "Wrong email or password.",
  emailTaken: "That email is already registered.",

  trustTitle: "Watch out for scams",
  trustBody:
    "Never send money before seeing the place in person. Nobody legitimate asks for a deposit by Western Union or crypto.",
  reportTitle: "Report this listing",
  reportReason: "Reason",
  reportDetail: "Details (optional)",
  reportSubmit: "Submit report",
  reportThanks: "Thanks — we'll take a look.",
  reasonSCAM: "Scam",
  reasonWRONG_PRICE: "Wrong price",
  reasonALREADY_RENTED: "Already rented",
  reasonAGENCY_POSING: "Agency posing as the owner",
  reasonOTHER: "Other",

  bathPrivate: "Private bathroom",
  bathShared: "Shared bathroom",
  phoneVerified: "Phone verified",
  metInPerson: "Met in person",
  upfront: "upfront",
  resultsFound: "listings",
  anyKind: "All types",
  prev: "Previous",
  next: "Next",
  pageOf: "of",
  contactShow: "Show contact",
  contactWhatsapp: "Message on WhatsApp",
  loginToContact: "Log in to see contact",
  contactNote:
    "Contact opens in WhatsApp. Your number is never shared without your say-so.",
  aboutLister: "About the lister",
  flatmatesCount: "flatmates",
  savingVsAgency: "Saved vs an agency",
  savingExplain:
    "Agencies in Tirana charge tenants about half the first month's rent. There's no commission here.",
  costBreakdown: "How that adds up",
  firstMonth: "First month's rent",
  commission: "Agency commission",
  totalUpfront: "Total upfront",
  seekerLooking: "Looking for",
  seekerBudgetUpTo: "Up to",
  noZonePref: "Anywhere in Tirana",
  depositShort: "deposit",
  commissionShort: "commission",
  refundable: "refundable",
  refundableNote: "The deposit comes back when you leave, if the place is left in order.",
  notRecovered: "not coming back",
  cashOnTheDay: "Cash in hand on signing day",
  sortUpfront: "Cost to move in",
  costNote:
    "First month's rent, the deposit and any agency commission, added up. This is what you hand over on the day you sign.",
  noCommissionNote:
    "Straight from the resident. No agent, no commission — and we never take a cut.",
  withCommissionNote:
    "This commission goes to the owner's agent, not to us. We never take a commission.",
  checkTitle: "Are you overpaying?",
  checkSub:
    "Tell us what you pay now and see where you land against the rest of Tirana. Takes ten seconds.",
  checkYourRent: "What do you pay a month?",
  checkCta: "Check my rent",
  checkAgain: "Try another",
  verdictOver: "You're paying over the market",
  verdictUnder: "You're under the market",
  verdictFair: "You're right at the market",
  verdictOverBody: "more than the median for the same thing.",
  verdictUnderBody: "less than the median for the same thing.",
  verdictFairBody: "Your rent is about where it should be for this area.",
  checkBasedOn: "based on",
  checkListingsWord: "live listings",
  checkCityWide:
    "There aren't enough listings in this area yet, so this compares against all of Tirana.",
  checkThinData: "The more people who check, the sharper this number gets.",
  checkMedianLabel: "Median",
  checkYouLabel: "You",
  checkSeeCheaper: "See listings below what you pay",
  noDepositNote: "No deposit. You pay the first month's rent and nothing else.",
  agencyFeeAsk: "Is an agent charging the tenant a commission?",
  agencyFeeAskHint:
    "Leave this off if you're letting the place yourself. Most listings here come straight from residents.",

  yes: "Yes",
  no: "No",
  cancel: "Cancel",
  loading: "Loading…",
  required: "This field is required",
  backToSearch: "Back to search",
};

export type TranslationKey = keyof typeof sq;

const DICTS: Record<Lang, Record<TranslationKey, string>> = { sq, en };

export type T = (key: TranslationKey) => string;

export function translator(lang: Lang): T {
  const dict = DICTS[lang];
  return (key) => dict[key];
}

/** Reads the language cookie in a server component. Albanian is the default. */
export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get(LANG_COOKIE)?.value === "en" ? "en" : "sq";
}

export async function getT(): Promise<{ lang: Lang; t: T }> {
  const lang = await getLang();
  return { lang, t: translator(lang) };
}

/** Domain-value labels that vary by language but live outside the flat dictionary. */
/**
 * Labels for enum values.
 *
 * One map PER ENUM, keyed by the enum's own type. This replaces a single flat
 * lookup that had two failure modes, both silent:
 *
 *  - a renamed enum value (PropertyKind.APARTMENT -> WHOLE_UNIT) fell through a
 *    `?? value` fallback and printed the raw constant to users;
 *  - `NONE` is a member of BOTH Furnished and Heating, so an unheated flat was
 *    labelled "unfurnished".
 *
 * Because each map is `Record<TheEnum, string>` with no fallback, adding or
 * renaming an enum value is now a compile error instead of a UI bug.
 */

const PROPERTY_KIND: Record<Lang, Record<PropertyKind, string>> = {
  sq: { ROOM: "Dhomë", WHOLE_UNIT: "Apartament", SHORT_TERM: "E përkohshme" },
  en: { ROOM: "Room", WHOLE_UNIT: "Apartment", SHORT_TERM: "Short let" },
};

const FURNISHED: Record<Lang, Record<Furnished, string>> = {
  sq: {
    FULL: "E mobiluar plotësisht",
    PARTIAL: "Pjesërisht e mobiluar",
    NONE: "Pa mobilje",
  },
  en: { FULL: "Fully furnished", PARTIAL: "Partly furnished", NONE: "Unfurnished" },
};

const HEATING: Record<Lang, Record<Heating, string>> = {
  sq: {
    AC: "Kondicioner",
    CENTRAL: "Ngrohje qendrore",
    ELECTRIC: "Elektrike",
    WOOD: "Me dru",
    NONE: "Pa ngrohje",
  },
  en: {
    AC: "Air conditioning",
    CENTRAL: "Central heating",
    ELECTRIC: "Electric",
    WOOD: "Wood stove",
    NONE: "No heating",
  },
};

const GENDER: Record<Lang, Record<GenderPref, string>> = {
  sq: { ANY: "S'ka rëndësi", MIXED: "Të përzier", FEMALE: "Vajza", MALE: "Djem" },
  en: { ANY: "No preference", MIXED: "Mixed", FEMALE: "Women", MALE: "Men" },
};

const BATHROOM: Record<Lang, Record<BathroomType, string>> = {
  sq: { PRIVATE: "Tualet privat", SHARED: "Tualet i përbashkët" },
  en: { PRIVATE: "Private bathroom", SHARED: "Shared bathroom" },
};

export const propertyKindLabel = (lang: Lang, v: PropertyKind) => PROPERTY_KIND[lang][v];
export const furnishedLabel = (lang: Lang, v: Furnished) => FURNISHED[lang][v];
export const heatingLabel = (lang: Lang, v: Heating) => HEATING[lang][v];
export const bathroomLabel = (lang: Lang, v: BathroomType) => BATHROOM[lang][v];
export const genderLabel = (lang: Lang, v: GenderPref | null | undefined) =>
  v ? GENDER[lang][v] : "";

export function formatDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

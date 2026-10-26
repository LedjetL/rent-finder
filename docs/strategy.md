# Strategy & binding decisions

Working notes for Rent Finder Tirana. This file holds the decisions that constrain
the code. The full memo — economics, agency response, cold start, legal, 12-month
plan — lives at <https://claude.ai/code/artifact/a6c1b0f4-e6de-4b43-b061-f0065f4695da>.

Evidence tags: `[verified]` sourced, `[likely]` consistent with several accounts,
`[assumption]` inference — challenge it.

---

## The thesis, corrected

Build the tool that lets tenants and landlords skip the rental agency. Launch on
**rooms and flatshares**, then whole apartments, then landlord accounts.

**The value is smaller than it first appears.** Albanian agencies charge the tenant
about **half a month's rent** and the landlord about **one month** (1/12 of the first
year's lease), first year only `[verified]`. The "three months" a tenant hands over at
signing is deposit + first month + commission — only the last slice is ours to remove.
A match saves a tenant roughly **€175 on a €350 flat**, not €900–1,500.

**Why rooms first is strategy, not sequencing.** A 50% commission on a €200 room is
€100. No agent with a car gets out of bed for that. The flatshare segment is
structurally unprofitable for the incumbent — that is the wedge.

**The number the business turns on:** one vacant month on a €350 flat costs €350,
almost exactly the agency's commission. An agency is *free* to a landlord if it fills
the unit a month faster. So we must fill within ~30 days of agency speed, or a
rational landlord loses money using us. **Instrument time-to-fill from listing one.**

---

## Who pays

| Live listings on one identity | Who | Price |
|---|---|---|
| 1–2 | Student with a spare room; family letting one flat | **Free, permanently. Full features.** |
| 3–9 | Small landlord | €10–15/mo |
| 10+ | Professional / agency office | €50–80/mo |

- **Seekers never pay.** Not to post, browse, message, or be seen first. Product
  constraint, not a pricing decision.
- Do **not** copy WG-Gesucht's revenue design — WG-Gesucht+ charges *seekers*
  €20.90/mo `[verified]`. Copy the product, not the part that taxes the people in the
  shortage.
- **No ad networks.** Display RPM in Albania ~€0.20–0.80/1k pageviews `[assumption]`.
  At 20k pageviews that is €4–16/month, versus €150 from ten landlord accounts —
  and network creative makes a trust-led site look like a scam farm. Direct local
  sponsorship (movers, furniture, ISP) at €50–200/mo is the acceptable version, later.
- **No payments code in year one.** We only ever invoice businesses; bank transfer
  and a spreadsheet covers the first few dozen. Stripe does not operate in Albania
  `[verified]`.
- The tier boundary is the **same phone-hash counter** used to detect agencies posing
  as private landlords. One signal, two jobs.

---

## Expensive to reverse — get these right now

### 1. One listing model

Two orthogonal axes, one table. Not four tables, not EAV.

```
direction     enum ('OFFER', 'WANTED')          -- who is speaking
property_kind enum ('ROOM', 'WHOLE_UNIT', 'SHORT_TERM')
```

A `WANTED` row reuses `price_*` as a budget ceiling and `available_from` as a move-in
date. Direction-specific fields stay nullable, policed by CHECK constraints:

```sql
CONSTRAINT offers_need_a_place CHECK (
  direction <> 'OFFER' OR (area_id IS NOT NULL AND price_amount IS NOT NULL)
)
```

This is what stops a second system being bolted on in month eight. Seeker profiles,
room ads and apartment ads share one search index, one moderation queue, one event
stream, one API resource.

> **Current code does not do this.** `prisma/schema.prisma` has `SeekerProfile` as a
> separate model. Refactor before there is data worth keeping.

### 2. Multi-city from the schema, Tirana-only in the UI

`city` table (slug, name, country_code, centroid, default_currency, `is_live`).
`area` belongs to a city. Only Tirana is `is_live`. Do not build a city switcher.

### 3. Multi-currency

- `price_amount numeric(12,2)` + `price_currency` — the truth, displayed as entered.
- `price_eur_cents integer` — **denormalized on write**. Every sort/filter/range query
  uses this one column. Without it, cross-currency search joins a rate table per row.
- `fx_rate_id` — so last March's €400 stays explainable next March.

### 4. Content i18n, not just UI strings

`listing_translation (listing_id, locale, title, description, source)`. Rows, not
columns — adding Italian is an INSERT, not a migration. Albanian default, English
first-class.

### 5. Append-only event log

`event (id bigserial, occurred_at, actor_user_id, subject_type, subject_id, verb, metadata jsonb)`.
No UPDATE, no DELETE — revoke at the DB role level. Verbs from day one:

`LISTING_PUBLISHED` · `LISTING_VIEWED` · `SEEKER_PROFILE_PUBLISHED` ·
`CONTACT_REVEALED` · `LISTING_MARKED_TAKEN` · `MATCH_CONFIRMED`

Because chat is off-platform, `CONTACT_REVEALED → LISTING_MARKED_TAKEN` is the entire
funnel. This is the one thing that cannot be backfilled.

### 6. API-first, cheaply

Everything behind `/api/v1/*` route handlers returning JSON; pages call those handlers.
**Rule: no page component touches Prisma directly.** A mobile app then becomes a second
client, not a rewrite.

---

## Indexes that matter

```sql
-- 95% of traffic hits only live, approved rows: keep the index small
CREATE INDEX listing_live_idx ON listing
  (city_id, direction, property_kind, price_eur_cents, available_from)
  WHERE status = 'ACTIVE' AND moderation_state = 'APPROVED';

CREATE INDEX listing_area_idx ON listing (city_id, area_id, price_eur_cents)
  WHERE status = 'ACTIVE' AND moderation_state = 'APPROVED';

CREATE INDEX listing_fts_idx  ON listing USING GIN (search_vector);
CREATE INDEX area_alias_idx   ON area    USING GIN (aliases);
CREATE INDEX event_subject_idx ON event (subject_type, subject_id, occurred_at DESC);
```

Partial indexes matter: rented and rejected rows accumulate forever.

**Deliberate denormalizations:** `price_eur_cents` (indexable cross-currency),
`listing.city_id` (derivable from area, but every query is city-scoped),
`search_vector` (trigger-maintained), `view_count`/`contact_count` (rolled up async
from `event`), `owner_phone_hash` (agency detection + tier boundary).

---

## Design system

Ported from the Claude Design canvas `Rent Finder Tirana.dc.html`. Tokens live in
[`src/app/globals.css`](../src/app/globals.css); do not invent new colours.

| token | light | dark |
|---|---|---|
| `--plaster` (page ground) | `#e9e5dd` | `#121210` |
| `--paper` (surfaces) | `#f7f5f1` | `#1a1a17` |
| `--sunk` (image wells) | `#e0dbd1` | `#232320` |
| `--ink` / `--ink-mid` / `--ink-mute` | `#191813` / `#56534a` / `#7c776c` | `#edeae1` / `#b0aaa0` / `#8b857a` |
| `--rule` / `--rule-soft` | `#c9c3b5` / `#ded9ce` | `#3a3931` / `#272620` |
| `--cobalt` (sole accent) | `#1e38c9` | `#93a6ff` |
| `--trust` | `#2f5c46` | `#86b79c` |

Type: **Bodoni Moda** display, **Archivo** text, **IBM Plex Mono** for every figure.
All three loaded with the `latin-ext` subset — non-negotiable, since ë and ç appear
in most listing titles and a missing subset fails silently.

Rules that hold the look together:

- **`border-radius: 0` everywhere.** Structure comes from hairline rules, not from
  cards with shadows. This is the deliberate departure from the template look.
- **Cobalt is spent almost entirely on the upfront cost.** The number the site
  exists to surface is the only coloured thing on the page.
- **Every figure is monospaced and tabular**, so prices compare down a column.
- The cost ledger's total sits under a `3px double` rule — the accounting
  convention, which is what keeps the money factual rather than decorative.
- Results are an editorial list (one lead entry, then split rows), never a card grid.

## Search

**Albanian diacritics will break search on day one.** People type *Selite* for
**Selitë** and *Laprake* for **Laprakë**, and Postgres ships no Albanian stemmer. Use
`unaccent` + the `simple` dictionary, normalising `ë` and `ç` on both the indexed and
query side. Skip this and roughly half of typed zone searches silently return nothing.

**Zones are landmarks, not administrative units.** Store the formal name; carry the
spoken ones in `area.aliases text[]` (GIN-indexed): *"te Komuna"*, *"te Myslymi"*,
*"te 21-shi"*, *"Studenti"*, *"te Zogu i Zi"*, *"te Xhamlliku"*, *"te Medreseja"*,
*"te Pazari"*, *"te Ekspozita"*, *"te Liqeni"* `[likely — verify with ten locals]`.

**Keep the local layout notation:** Garsoniere / 1+1 / 2+1 / 3+1 / 4+1. "2 bedroom"
reads foreign and loses the living room.

Upgrade path: plain Postgres now → `tsvector` + `pg_trgm` → Typesense/Meilisearch at
~50k listings. Put it behind one `SearchProvider` interface from the first commit so
the swap is one class.

---

## MVP scope

**Day one — all built:** accounts · zone/price/date/flatmate filters · seeker
profiles (browse + create) · post a listing · mark-as-taken with attribution ·
favourites · scam reporting · sq/en throughout.

Auth is still email + password. Phone is already the identity primitive in the
schema and `passwordHash` is nullable, so swapping in phone OTP is a code change,
not a migration.

### Guarantees enforced in the database, not by convention

Verified by attempting the illegal write and being refused:

| Guarantee | Mechanism |
|---|---|
| Gender preference only on rooms, never whole units | `gender_pref_rooms_only` CHECK |
| An OFFER must name a zone | `offer_needs_area` CHECK |
| The event log cannot be altered or erased | `event_no_update` / `event_no_delete` triggers |

The last one matters most: it is why the match data can be trusted a year from now.
`TRUNCATE` bypasses row triggers, which is the dev-reset path the seed uses; in
production, revoke TRUNCATE at the role level.

### Photos and stolen-image detection

Uploads go through `src/lib/photos.ts`: EXIF-rotated, resized to a 1600px longest
edge, re-encoded as WebP, written under `public/uploads/<listingId>/`. Swapping in
object storage later only changes `persist()`.

Every upload also gets a **64-bit dHash**, compared against every stored hash on
publish. A match within 8 bits holds the listing as `PENDING` rather than blocking
it — the same photo legitimately reappears when a flat is re-let. Measured
separation (`npm run check:photos`):

| comparison | distance |
|---|---|
| same photo, resized to 900px and re-compressed at q62 | 2 bits |
| same photo, brightened 12% | 1 bit |
| unrelated photo | 30 bits |

Two things that will silently break this if changed: `greyscale()` alone still
emits three channels, so the raw buffer needs `toColourspace("b-w")` or the hash
becomes near-constant for every image; and `serverActions.bodySizeLimit` in
next.config.ts must stay above `MAX_PHOTOS * MAX_BYTES` or uploads are rejected at
1 MB.

That is stage 3 of the verification ladder, built early because it costs one pass
over bytes we were already decoding.

### Moderation, live from day one

A listing from an unverified phone publishes as `PENDING` rather than `APPROVED`,
and `PENDING` rows are excluded by the partial indexes every query uses.

`/admin` is the queue. Access is by `ADMIN_EMAILS` in `.env` — an env var, not a
database flag, so it needs no migration and cannot be escalated by anything that
compromises app data. Non-admins get a 404, not a 403: the surface should not
confirm it exists. Every action re-checks rights server-side, because a hidden
button is not access control.

The queue shows, per listing: the two automated signals (photos matching an
existing listing within 8 bits; three or more live listings on one phone hash), the
poster's phone as a `tel:` link, and approve / shadow / reject.

### Phone verification: don't buy it yet

SMS to Albania is **$0.1101 via Twilio** plus ~$0.05 per Verify call `[verified]` —
about $0.16 per verification, one of the priciest countries on the list. The lever
is *when* you verify, not *how*:

| trigger | year-one volume | cost |
|---|---|---|
| every signup | ~5,000 seekers | ~$800 |
| only at publish | ~400 listings | ~$64 |
| **manual, during the call you're making anyway** | ~400 | **€0** |

Verification is load-bearing for three things — anti-spam, agency detection, the
paid tier — and all three concern people who *post*, not people who browse. At ~one
new listing a day, approving by hand is cheaper and more informative than any OTP
provider, and §4 already has you ringing every early landlord. The Approve button
carries a "spoke to them — mark phone verified" checkbox: that is tier 0.

**Tier 1, when manual review passes ~4h/week: inbound WhatsApp.** The user sends
*you* a code via a `wa.me` link; inbound conversations and replies inside the
24-hour window are free with no cap `[verified, Nov 2024]` — but check the reported
October 2026 change to that window before building. It also proves a working
WhatsApp, which is what the contact flow actually depends on; SMS does not.

**Tier 2, paid SMS:** only if instant self-serve at volume ever becomes necessary.
No sender-ID pre-registration is required in Albania `[verified]`. If you build it,
rate-limit to 3 sends per number per day — SMS pumping is a standard attack on
unprotected zero-revenue projects, and at $0.11 a message it is a real bill.

**Deferred — maps.** Renters search by zone name. Revisit at ~2,000 active listings.

**Deferred — chat → WhatsApp handoff.** *Show contact* → require login → write
`CONTACT_REVEALED` → open a `wa.me` deep link. We get match attribution without owning
the channel. Revisit when we need to charge for contact.

**Not building:** microservices, Kubernetes, recommendation ML, escrow/deposits,
native apps, multi-city UI, Italian translations, ratings, automated ID verification.
Revisit triggers for each are in the full memo.

---

## Legal — do not guess

- **Law 124/2024 on Personal Data Protection**, in force 1 Feb 2025, GDPR-aligned,
  repealed Law 9887/2008; some provisions apply from 17 Jan 2027 `[verified]`.
  Applies whether or not we charge anyone. Privacy notice in Albanian; access,
  erasure, portability flows; pseudonymise the actor in `event` on erasure, retain
  the event.
- **Gender / age filters — highest-risk feature.** Allow gender preference only on
  `ROOM` listings where the advertiser lives in the property; forbid on whole units.
  Age as a soft, non-binding preference, never a hard filter. Never ethnicity,
  nationality, religion or family status. **Needs a lawyer.**
- Rental income is taxed at 15% with mandatory declaration and contract registration
  `[verified]` — so a meaningful share of landlords actively want no digital record
  `[likely]`. Keep listings pseudonymous publicly; never position as a compliance tool.
- ToS must state we are a listings platform, not an agent, broker or party to a lease.
  Per-match commission is what would drag us toward brokerage licensing — another
  reason for subscriptions over transaction fees.

---

## Timing

Today is Sept 2026 and **the student wave is now** — too late to ship into. Target
**March 2027** launch, five months before the Aug 2027 wave, so the site is dense with
supply when students start looking. Use Sept–Oct 2026 as a free live research window
for the two validation tests (no code required).

**Year-one metric is confirmed matches, not listings or sessions.**

## The risk that isn't competition

No revenue in year one, and the cold start needs 10–15 unpaid hours a week doing
concierge work — writing listings, shooting photos, screening candidates. Cash floor
is small (under €300/yr excluding ads and legal `[assumption]`). The hours are the
constraint. Plan the concierge → self-serve handover explicitly around public launch.

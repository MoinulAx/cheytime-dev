# Content Map — legacy site → clock

The brief was a new front end for the *same* content. This audits what the
legacy site actually says against what the clock currently shows, page by page.

**Headline finding: the About / bio copy on the new site is not Chey's.** It
reads "Architect of sound… born from a rejection of the polished and
predictable… Visuals — Studio Null". None of that appears on the legacy site.
Chey's real biography — psychology background, her father and free-styling,
LL Cool J — is on `/about` and `/` and has never been migrated.

`MIGRATION_REPORT.md` §3 recorded that invented copy as "legacy copy", which is
how it got here. Treat this file as the correct source, not that section.

Status key: **LIVE** on the clock · **MISSING** not carried over · **CHECK**
needs a decision.

---

## `/` Home → XII

| Content | Status |
|---|---|
| "Chey Time" / "Hip Hop's Princess" | LIVE |
| Staten Island, NY | LIVE |
| Quote: *"I don't follow trends, I'm trending"* | **MISSING** — the strongest line on the legacy site |
| Data strip: Based · Genre · Latest · Direction | **MISSING** (see below) |
| Section labels "001 — The Sound", "002 — The Process" | **MISSING** |
| Long-form bio (the `bioText` paragraph) | **MISSING** |
| Portraits: `chey-braids`, `mediakit`, `chey-earring` | **MISSING** — clock uses YouTube stills instead |

Data strip values, verbatim:

- **Based** — Staten Island, NY
- **Genre** — Hip-Hop
- **Latest** — Whips & Chains Freestyle
- **Direction** — Borleone Films

"Whips & Chains Freestyle" and "Borleone Films" appear nowhere on the clock.

---

## `/about` About → II

| Content | Status |
|---|---|
| Para 1 — Cheyenne, Staten Island, psychology / special-needs background, move to music and acting, family's musical background | **MISSING** |
| Para 2 — father introduced her to free-styling; grew up musical; LL Cool J's "Mama Said Knock You Out" as a formative track | **MISSING** |
| Long-form `bioText` (originality, self-confidence, advice to aspiring artists, acting ambitions) | **MISSING** |
| Current clock bio ("Architect of sound…") | **REMOVE** — not Chey's copy |
| Credits | LIVE — now Artist/Production/Direction Chey, Visuals + Web rummspace |
| Quote "The mic captures the exact frequency of the room…" | **CHECK** — invented, same origin as the bio |

---

## `/music` Music → IV

| Content | Status |
|---|---|
| YouTube channel @CheyMusic127 | LIVE |
| Four videos | LIVE — **but titled "Video I–IV" in the database** |
| Real titles: Poppin' (2026), Long Kiss Goodnight (2025), Session III, Session IV | **MISSING** — the clock's static fallback had them; live rows do not |
| "Whips & Chains Freestyle" — the current single | **MISSING** entirely |
| Headings "Tracklist", "Singles & Tracks" | **CHECK** — layout copy, may not survive the redesign |
| Spotify / Apple Music | **MISSING** — no URLs exist yet |

⚠️ Applying the migration made Music *worse*: `music_links` is seeded with
placeholder titles, and live data now beats the correct static fallback. Fixing
those rows is the single highest-value change on this list.

---

## `/store` Store → VI

| Content | Status |
|---|---|
| 6 products, prices, materials | LIVE |
| Product photography | **MISSING** — `image_url` empty on every row; the clock draws numbered placeholders |
| Cart, checkout, "Add to cart" | **CHECK** — Stripe still runs from the legacy repo |

Product names ("Construct Tee", "Volume VII Hoodie", "Material Tension
Poster") read as scaffold filler in the same voice as the invented bio. Worth
confirming these are real merch.

---

## `/gallery` Gallery → III · V · IX + X archive

| Content | Status |
|---|---|
| 9 archive rows (alt + meta) | LIVE in admin, **invisible on site** — every row has an empty `image_url`, so all are filtered and the archive falls back |
| Gallery chapters III / V / IX | LIVE — YouTube stills, seeded by the migration |
| 7 real photographs in the legacy repo | **MISSING** — now copied to `public/assets/`, not yet used |

Available photography: `chey-braids`, `chey-earring`, `chey-furhat`,
`chey-mediakit`, `editorial-1`, `editorial-2`, `editorial-3`.

---

## `/blog` Blog → I Journal

| Content | Status |
|---|---|
| 3 posts with full bodies | LIVE |
| Per-post pages (`/blog/:slug`) | **CHECK** — the clock has no detail route, so only posts with an external URL link out |

---

## `/events` Events → VIII

| Content | Status |
|---|---|
| Empty state | LIVE |
| Real events | none exist in either site |

---

## `/contact` Contact → X

| Content | Status |
|---|---|
| Form (name, email, subject, message) + validation | LIVE, writes to `contact_submissions` |
| 48-hour response line | LIVE |
| Email | **CHECK** — three addresses in play (below) |
| YouTube / Instagram / TikTok | LIVE |
| Spotify / Apple Music | **MISSING** — render as "· soon" |

Three contact addresses exist:

1. `contact@cheymusic.com` — legacy site
2. `Smgproductions2024@gmail.com` — 2026 EPK, currently on the clock
3. `kimpragency@gmail.com` — Empress Links PR (CEO Kim), 2024 media kit

Newest wins by default, but press and bookings may be deliberately separate.

---

## `/portfolio` and `/download`

- **Portfolio** — placeholder from the original scaffold (SS26 lookbooks, Milan
  runway). Deliberately not migrated. Reinstate only if real work replaces it.
- **Download** — post-purchase delivery page, tied to Stripe. Belongs with the
  checkout decision, not the content migration.

---

## Order of work

1. **Replace the About bio with Chey's real one**, and the Home quote and data
   strip. Biggest gap, pure content, no new schema.
2. **Fix `music_links` titles.** Currently a live regression.
3. **Use the real photography** for panel images and the archive, instead of
   YouTube stills.
4. **Confirm with the client:** the contact address, whether the merch names
   are real, and whether the invented pull quote should stay.

Everything in 1–3 is content already in hand — no new decisions needed.

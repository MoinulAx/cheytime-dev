# Content Map — legacy site → clock

The brief was a new front end for the *same* content. This audits what the
legacy site actually says against what the clock currently shows, page by page.

**Original headline finding — since fixed.** The About copy read "Architect of
sound… born from a rejection of the polished and predictable… Visuals — Studio
Null". None of it appears on the legacy site. Chey's real biography —
psychology background, her father and free-styling, LL Cool J — now lives in
`site_settings.about.bio`, and the invented pull quote has been replaced by her
own line, *"I don't follow trends, I'm trending."*

`MIGRATION_REPORT.md` §3 recorded that invented copy as "legacy copy", which is
how it reached the page.

> ⚠️ **This file made the same mistake.** The Music row below listed "Session
> III" and "Session IV" among the "real titles". They were invented, in the
> same pass as the bio — and the two genuine titles beside them were attached
> to the wrong video ids. Corrected in place below. The lesson is not that one
> document is trustworthy and another is not: it is that a title with no cited
> source should be checked against `music_releases` or the legacy site before
> anyone writes it anywhere.

Status key: **LIVE** on the clock · **MISSING** not carried over · **CHECK**
needs a decision.

---

## `/` Home → XII

| Content | Status |
|---|---|
| "Chey Time" / "Hip Hop's Princess" | LIVE |
| Staten Island, NY | LIVE |
| Quote: *"I don't follow trends, I'm trending"* | LIVE — `site_settings.about.quote` |
| Data strip: Based · Genre · Latest · Direction | LIVE — `site_settings.home.fact.*` |
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
| Para 1 — Cheyenne, Staten Island, psychology / special-needs background, move to music and acting, family's musical background | LIVE — `site_settings.about.bio` |
| Para 2 — father introduced her to free-styling; grew up musical; LL Cool J's "Mama Said Knock You Out" as a formative track | LIVE — same key |
| Long-form `bioText` (originality, self-confidence, advice to aspiring artists, acting ambitions) | LIVE — same key |
| Old clock bio ("Architect of sound…") | REMOVED |
| Credits | LIVE — Artist/Production/Direction Chey, Visuals + Web rummspace |
| Quote "The mic captures the exact frequency of the room…" | REMOVED — invented, replaced by Chey's own line |

---

## `/music` Music → IV

| Content | Status |
|---|---|
| YouTube channel @CheyMusic127 | LIVE |
| Twelve tracks with real titles | LIVE — `music_releases` |
| "Whips & Chains" — the current single | LIVE — `w0EZCrY0hsY` |
| Headings "Tracklist", "Singles & Tracks" | Not carried over — the panel renders one flat list |
| Spotify / Apple Music | **MISSING** — no URLs exist yet |
| Release years | **CHECK** — no such column; the year shown is the row's insert date |

The earlier warning here — that `music_links` was seeded with "Video I–IV"
placeholders and was beating the static fallback — no longer applies.
`music_releases` now holds twelve real tracks and `music_links` is empty.

The four ids the static fallback carries, with their actual titles, since two
of these pairings were previously recorded wrongly in this file:

| id | Title |
|---|---|
| `29vWUXMTkME` | CHEY - Girls Just Wanna Have Fun FT. Steph G (GJWHF) |
| `OamCSPuswjg` | Poppin freestyle |
| `4T6mFd2Sz_Y` | Long kiss goodnight |
| `l62mMBXck70` | CHEY - Bar talk ft Hue Hef & Jmaul |

---

## `/store` Store → VI

| Content | Status |
|---|---|
| Products, prices, materials | LIVE — two $15 cotton tees |
| Product photography | LIVE — both rows carry a `site-assets` image, rendered in the tile |
| Cart, checkout, "Add to cart" | **CHECK** — Stripe still runs from the legacy repo; Reserve is local state only |

The scaffold-filler names ("Construct Tee", "Volume VII Hoodie", "Material
Tension Poster") are gone from `merch_products` — the question of whether they
were real merch is closed. A row without a usable image still falls back to the
numbered plate.

---

## `/gallery` Gallery → IX

| Content | Status |
|---|---|
| Every photograph | LIVE — one Gallery section reading all of `gallery_items` (41 rows) |
| 34 photographs | LIVE |
| 7 Instagram appearances | LIVE as link cards under "Elsewhere" — 50 Cent, Method Man ×2, Live at 105.1, Sway's Universe, Mauleano, Yah Yah |
| 3 rows pointing at `editorial-1/2/3.jpg` | **BROKEN** — the files were deleted in `bd11d93`; the rows still reference them and render 404s |

The Instagram rows hold post and reel permalinks in `image_url`, not images.
They used to be dropped silently — `next/image` cannot draw them — which is how
seven rows went missing. `lib/loaders/gallery.ts` now sorts them into link
cards instead.

There used to be four photo surfaces: chapters on III, V and IX plus a grid
inside Contact. All four read the same table, sliced up. They are now one
section at IX; `gallery_items.collection` still records the old grouping but
nothing reads it, and III and V render inactive rather than being padded with
duplicates.

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

Items 1–3 of the original list are done: the real bio, quote and data strip are
in `site_settings`; the music titles are real (and the `music_links` regression
is moot, that table is empty); the real photography is in place of the YouTube
stills. What is left:

1. **Repoint or delete the three `editorial-*.jpg` gallery rows.** Three 404s
   render today. A row edit, so it needs an admin session — the anon key cannot
   write.
2. **Confirm the contact address** (three candidates, below).
3. **Resolve "Direction".** `about_credits` says *Chey*; the home data strip
   says *Borleone Films*. Both render, in different panels.
4. **Spotify and Apple Music URLs**, if they exist — the chips say "· soon"
   until `social_links.url` is filled.
5. **Release years**, if Chey wants them accurate. `music_releases` has no such
   column, so the year shown is the row's insert date and is the same for every
   track. Needs a migration, so ask first.

Nothing on this list can be finished without either the client or an admin
session.

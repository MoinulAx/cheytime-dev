# Handoff — Chey Time

Paste the block at the bottom into a fresh Claude Code session. Everything
above it is the detail that block points at.

---

## Where this stands

`cheytime-dev` is a Next.js 15 clock — a full-screen dial where each Roman
numeral opens a panel. It replaces `cheytime-old`, a Vite/React site, and both
read **one Supabase project** (`enhduflezmiugpjaovhz`).

**All content is database-backed.** Nothing a visitor reads is compiled into
the bundle. `lib/sections.static.ts` still exists but is only the fallback when
Supabase is unreachable.

### The dial

| Hour | Section | Table |
| --- | --- | --- |
| XII | Home | `site_settings` (`home.*`) |
| I | Upcoming | `upcoming_releases` |
| II | About | `site_settings` (`about.*`) + `about_credits` |
| III | Album | `music_releases.audio_url` (full tracks) |
| IV | Music | `music_releases`, falling back to `music_links` |
| V | Journal | `blog_posts` |
| VI | Store | `merch_products` (+ `merch_product_images`) |
| VII | Digital | `music_products` (preview clips only) |
| VIII | Events | `events` |
| IX | Gallery | `gallery_items` |
| X | Contact | `site_settings` (`contact.*`) + `social_links` |
| XI | Press | `press_features` |

**This table is the default, not the truth.** Positions come from
`site_sections.hour_index` and are editable in the admin — the numbers above
are what `lib/sections.static.ts` falls back to when Supabase is unreachable.
`placeSections` resolves the layout: Home is pinned to XII (the clock treats
hour 0 as the reset), explicit choices are placed first come first served, and
anything colliding takes the nearest free hour rather than vanishing. Numeral
and rotation angle are both derived from the final hour, so a moved section
never carries its old numeral. Unit tests for the collision cases are in the
commit that introduced it.

Every section's title, subtitle, panel image and supporting lines come from
`site_sections`, including `image_position` — the CSS `object-position` for
that panel's photograph. Every hero is drawn into a fixed 16:9 frame with
`object-fit: cover`, so a portrait crop or an off-centre subject gets pushed
out of frame; that column is the fix, and it is editable in the admin as
"Image framing".

The dial is now full: twelve sections, twelve hours. Worth knowing before
adding a thirteenth — `placeSections` guarantees every section a slot, and
that guarantee holds only while there are at least as many hours as sections.

Hour I is announcements (`upcoming_releases`), deliberately its own table
rather than a flag on `music_releases`. That table is catalogue and needs the
thing to exist before it can show it; an announcement is a title, a date that
may not be fixed, a poster, and often nothing playable. Forcing it in would
mean `platform_link` doubling as a pre-save URL and every catalogue query
learning to exclude unreleased rows.

### Admin

`/admin`, Supabase Auth. Fifteen tabs, one per table, each stating in plain
words which hour its rows appear on — or that they are internal.

Auth goes through the deployed `admin-auth` edge function (service role, so
the answer does not depend on what the caller can see), falling back to a
direct `user_roles` read. **The role check is UX only — RLS is the boundary.**

Writes are Server Actions that call `revalidatePath("/")`, so an edit here
clears the 60s ISR cache immediately. Edits from the legacy admin still take
up to a minute.

### Done

- Supabase wired: typed clients, ten loaders, ISR at 60s
- Full admin ported from the legacy `Admin.tsx`
- All content moved to the database, including section chrome
- Chey's real biography restored (see the warning below)
- Press section built from the 2026 EPK
- Real photography in; AI stock removed
- Horological polish: live seconds hand, minute track, escapement spring
- `/admin` forced dynamic — see the trap below
- Store renders the product photographs from `merch_products.image_url`
- Instagram archive rows render as link cards instead of being dropped
- Journal, Gallery, Music and Press each have a full page behind a "See all";
  the panel is a preview
- Stripe checkout wired to the existing `create-checkout-session` function
- A real basket: `/cart`, a `CartProvider` in the root layout, and Add buttons
  on Store and Digital in place of the old one-click Buy
- Gallery rebuilt as CSS-column masonry matching the legacy site, reading
  `gallery_items.aspect_ratio` (which nothing used to read), with a lightbox

### Verified against the live database — 2026-06-10

The loaders had never executed against real rows; `ADMIN_PLAN.md` §2 recorded
this as blocked because the previous environment could not reach
`enhduflezmiugpjaovhz.supabase.co`. It can now. With `.env.local` set, a build
logs **no** `[loaders] … using static content` lines, and every section reads
live.

Row counts at that date, which is the part most likely to be out of step with
prose written earlier:

| Table | Rows | |
| --- | --- | --- |
| `site_settings` | 15 | |
| `site_sections` | 10 | |
| `music_releases` | 12 | real titles and links |
| `music_links` | **0** | the fallback path is dead — see below |
| `merch_products` | 2 | both with photographs |
| `music_products` | 2 | |
| `gallery_items` | 41 | 34 images · 7 Instagram links |
| `press_features` | 4 | |
| `blog_posts` | 3 | |
| `about_credits` | 5 | |
| `social_links` | 5 | Spotify and Apple Music still `null` |
| `events` | **0** | the empty state is what renders |

**`music_releases` and `music_links` have swapped roles.** Earlier notes say
`music_releases` is empty and the seeded `music_links` placeholders are what
render. The reverse is now true: `music_releases` carries twelve real tracks
and `music_links` is empty. `loadMusic()` still falls back, but nothing is
there to fall back to.

### Read these first

- `CONTENT_MAP.md` — legacy content vs the clock, page by page
- `ADMIN_PLAN.md` — admin architecture, Supabase reference, granting access
- `supabase/SCHEMA.sql` — the whole database in one file
- `supabase/VERIFY.sql` — read-only post-deploy check: tables, columns, dial
  layout, RLS, buckets, row counts. Run it after every `db push`.
- `supabase/migrations/` — what actually runs

---

## Traps

**`MIGRATION_REPORT.md` §3 is wrong.** It records invented copy ("Architect of
sound…", "Studio Null") as legacy copy, and that is how fabricated text reached
the live site. `CONTENT_MAP.md` supersedes it. Chey's real biography is now in
`site_settings.about.bio`.

**The invention was not limited to the bio.** All four music titles in
`lib/sections.static.ts` were wrong, in both directions: two were made up
("Session III", "Session IV") and the two that were real were attached to the
wrong videos — `29vWUXMTkME` was labelled "Poppin'" when it is "Girls Just
Wanna Have Fun", and `OamCSPuswjg` was labelled "Long Kiss Goodnight" when it
is the Poppin' freestyle. They are now transcribed from `music_releases`.
`CONTENT_MAP.md` repeated the error, listing all four as "real titles", so a
reader acting on that line would have written two fabrications into the
database. Assume anything naming Chey's work that has no cited source is
suspect until checked against a table or the legacy site.

**Migration history is repaired but odd.** Remote versions ran 2 seconds
earlier than the committed filenames — a Lovable artifact. Two remote versions
(`20260319201838`, `20260326213428`) have no file at all, so the migrations are
not a complete record of the schema. Never mark a migration `applied` that has
not actually run.

**Both storage buckets are public.** `music-files` does not withhold a paid
track from anyone with its URL. The site never renders `audio_url`, but that is
obscurity, not access control.

**`next/image` throws on an unconfigured host, and that throw kills the whole
page.** Any DB image URL must pass `lib/loaders/images.ts` first. This already
caused one production outage.

**Never swallow Next's control-flow errors.** Anything catching around a
framework call must rethrow via `lib/next-signals.ts`. This has been
reintroduced twice.

**Admin routes must stay dynamic.** They read cookies; caching an
authenticated page could serve one admin's view to the next visitor.
`app/admin/layout.tsx` now declares `export const dynamic = "force-dynamic"`
for the whole subtree, because reading cookies only makes a route dynamic *as
a side effect* and that is too thin a thread here. `getAdminUser()` returns
early when Supabase env is missing, before it touches `cookies()` — nothing
dynamic is read, so Next prerenders `/admin`, and since `NEXT_PUBLIC_*` is
inlined at build time a production build without env would bake a
redirect-to-login into the route and keep serving it after env was fixed.
Every admin locked out, by a missing variable. Never add `revalidate` here;
`force-dynamic` is its opposite, not a variant of it.

**A missing env var fails silently and looks fine.** Without
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` the loaders fall
back to `lib/sections.static.ts` and the site renders perfectly while serving
stale copy. The only signal is `[loaders] … using static content` in the build
log. Check it after every deploy.

**`gallery_items.meta` is sometimes a type marker, not a caption.** On the
Instagram rows it holds the literal string `instagram` — the legacy gallery
keyed its embed off it. Rendered as a caption it produced "Instagram · Reel ·
Instagram". `lib/loaders/gallery.ts` drops it when it only repeats the
platform.

**`blog_posts.date` is TEXT**, not a date. Seeds use `2026.02.27`.

**Stripe lives in the edge functions, not here.** This site posts a cart to
`create-checkout-session` and follows the returned URL; it never holds the
secret key or builds line items. `stripe-webhook` marks the purchase paid, so
`/checkout/success` deliberately confirms nothing — it is reached by redirect,
not by proof of payment, and anyone can open the URL.

**Cart prices are display-only, and nothing validates them yet.** `lib/cart.tsx`
keeps the basket in `localStorage` under `cheytime.cart.v1`, and `/cart` posts
those titles, prices and quantities straight to `create-checkout-session`,
which builds the Stripe line items from what it is sent. Anyone can edit that
key in devtools and buy a hoodie for a dollar. The legacy store has the same
hole — this is inherited, not introduced — but it needs closing in the edge
function (look the price up in `merch_products` / `music_products` by id rather
than trusting the payload) before this takes real money. The client ids are
already namespaced `merch:<uuid>` / `music:<uuid>` so the function has
something to look up.

**`music_releases` has no release-year column.** `loadMusic()` derives `year`
from `created_at` — the row's insert date, not when the track came out. Every
track therefore shows the same year. Documented in the loader as deliberate;
fixing it properly means a migration.

---

## Open decisions — need the client

1. **Contact email.** Three exist: `contact@cheymusic.com` (legacy),
   `Smgproductions2024@gmail.com` (2026 EPK, currently live),
   `kimpragency@gmail.com` (Empress Links PR, 2024 media kit).
2. **"Direction" contradicts itself on the page.** `about_credits` says
   *Chey*, `site_settings.home.fact.direction` says *Borleone Films*. Both are
   verbatim from their own source and both render right now, in different
   panels.

### Resolved by the live data — 2026-06-10

- **Merch names.** The scaffold-filler names ("Construct Tee", "Volume VII
  Hoodie", "Material Tension Poster") are gone from `merch_products`. Two real
  products remain, both $15 cotton tees with photographs.
- **EPK video IDs.** `music_releases` names three of the four: `lXucfyLDE7M` is
  "Sway in the morning freestyle", `xAkX2h97qeE` is "CHEY - Hair and Nails",
  and the current single "Whips & Chains" is `w0EZCrY0hsY`. `SIcEPXmavDk`
  appears nowhere in the table and is still unaccounted for.

## Known gaps

- **Three `gallery_items` rows point at deleted files.** `editorial-1.jpg`,
  `editorial-2.jpg` and `editorial-3.jpg` were removed from `public/assets` in
  `bd11d93`, but the rows still reference them, so three 404s render. Relative
  paths bypass `isRenderableImage()` by design — "this app serves them" — an
  assumption that broke when the files went. Fix is a row edit, which needs an
  admin session; the anon key cannot write.
- No bulk upload (the legacy admin has it)
- Album/track nesting is by pasting a `parent_album_id`
- Stripe checkout still runs from the legacy repo
- Spotify and Apple Music are `null` in `social_links` and render as "· soon"

## Verifying in a browser

`next/image` lazy-loads and Framer Motion drives the panels, and **both stall
in a background tab**: Chrome defers lazy fetches and pauses
`requestAnimationFrame` when `document.visibilityState === "hidden"`. Measured
there, images report `complete: false, 0×0` and animated wrappers sit at
`opacity: 0` — indistinguishable from being broken. Foreground the tab (a
screenshot does it) before believing any such measurement.

---

## The prompt

```
You're picking up Chey Time (github.com/MoinulAx/cheytime-dev), a Next.js 15
App Router site: a full-screen interactive clock where each Roman numeral
opens a content panel. It replaces a legacy Vite site (cheytime-old) and both
read the same Supabase project, enhduflezmiugpjaovhz.

Read these before touching anything:
  HANDOFF.md          — state, traps, open decisions
  CONTENT_MAP.md      — legacy content vs the clock, page by page
  ADMIN_PLAN.md       — admin architecture and Supabase reference
  supabase/SCHEMA.sql — the whole database in one file

State: every section is database-backed and the admin at /admin covers all
fourteen tables. lib/sections.static.ts is only the offline fallback. The
loaders were verified against live rows on 2026-06-10 — see the row counts in
HANDOFF.md, which supersede any earlier prose about what a table holds.

Rules that came from real breakage:
  • Any database image URL must pass lib/loaders/images.ts before reaching
    next/image — an unconfigured host throws and takes down the whole page.
  • Anything catching around a Next call must rethrow framework signals via
    lib/next-signals.ts. Swallowing one has caused bugs twice.
  • Adapt legacy rows in the loaders, never in the renderers.
  • Admin routes must stay dynamic. app/admin/layout.tsx declares
    force-dynamic; never add revalidate to them.
  • Without Supabase env the loaders fall back to static content silently and
    the site looks fine while stale. Check the build log for
    "[loaders] … using static content".
  • Do not write brand copy for this artist. MIGRATION_REPORT.md §3 records
    invented copy as legacy copy, and CONTENT_MAP.md repeated it for the music
    titles — treat any uncited claim about Chey's work as suspect and check it
    against a table or the legacy site. If content is missing, ask.

Verify with: npx tsc --noEmit && npx next lint && npx next build
The build must show / as ○ Static with a 1m revalidate, and /admin as ƒ.
Copy .env.local.example to .env.local first, or every loader silently serves
the static fallback.

Ask me before: changing the clock's geometry or animations, deciding anything
in the "Open decisions" list, or applying a migration.
```

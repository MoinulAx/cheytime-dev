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
| I | Journal | `blog_posts` |
| II | About | `site_settings` (`about.*`) + `about_credits` |
| III | — | inactive |
| IV | Music | `music_releases`, falling back to `music_links` |
| V | — | inactive |
| VI | Store | `merch_products` (+ `merch_product_images`) |
| VII | Digital | `music_products` |
| VIII | Events | `events` |
| IX | Gallery | `gallery_items` |
| X | Contact | `site_settings` (`contact.*`) + `social_links` |
| XI | Press | `press_features` |

Every section's title, subtitle, panel image and supporting lines come from
`site_sections`.

III and V are deliberately inactive. They used to hold gallery chapters that
were the same `gallery_items` rows Gallery already shows — four photo surfaces
for one table. Padding, so it was removed.

### Admin

`/admin`, Supabase Auth. Fourteen tabs, one per table, each stating in plain
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

### Read these first

- `CONTENT_MAP.md` — legacy content vs the clock, page by page
- `ADMIN_PLAN.md` — admin architecture, Supabase reference, granting access
- `supabase/SCHEMA.sql` — the whole database in one file
- `supabase/migrations/` — what actually runs

---

## Traps

**`MIGRATION_REPORT.md` §3 is wrong.** It records invented copy ("Architect of
sound…", "Studio Null") as legacy copy, and that is how fabricated text reached
the live site. `CONTENT_MAP.md` supersedes it. Chey's real biography is now in
`site_settings.about.bio`.

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

**`blog_posts.date` is TEXT**, not a date. Seeds use `2026.02.27`.

---

## Open decisions — need the client

1. **Contact email.** Three exist: `contact@cheymusic.com` (legacy),
   `Smgproductions2024@gmail.com` (2026 EPK, currently live),
   `kimpragency@gmail.com` (Empress Links PR, 2024 media kit).
2. **Merch names.** "Construct Tee", "Volume VII Hoodie", "Material Tension
   Poster" read like scaffold filler in the same voice as the invented bio.
3. **EPK video IDs.** `SIcEPXmavDk`, `lXucfyLDE7M`, `xAkX2h97qeE` are in the
   press kit, and "Whips & Chains Freestyle" is named as the current single —
   but which id is which is recorded nowhere. Not guessed on purpose.
4. **About credits say "Direction — Chey"** while the home data strip says
   "Borleone Films". Both verbatim from their own source.

## Known gaps

- Store draws numbered placeholders — `merch_products.image_url` is empty on
  every row
- Nine original `gallery_items` rows have no image and are invisible
- No bulk upload (the legacy admin has it)
- Album/track nesting is by pasting a `parent_album_id`
- Stripe checkout still runs from the legacy repo

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
fourteen tables. lib/sections.static.ts is only the offline fallback.

Rules that came from real breakage:
  • Any database image URL must pass lib/loaders/images.ts before reaching
    next/image — an unconfigured host throws and takes down the whole page.
  • Anything catching around a Next call must rethrow framework signals via
    lib/next-signals.ts. Swallowing one has caused bugs twice.
  • Adapt legacy rows in the loaders, never in the renderers.
  • Admin routes read cookies and must stay dynamic — never add revalidate.
  • MIGRATION_REPORT.md §3 records invented copy as legacy copy. Trust
    CONTENT_MAP.md instead. Do not write brand copy for this artist; if
    content is missing, ask.

Verify with: npx tsc --noEmit && npx next lint && npx next build
The build must show / as ○ Static with a 1m revalidate, and /admin as ƒ.

Ask me before: changing the clock's geometry or animations, deciding anything
in the "Open decisions" list, or applying a migration.
```

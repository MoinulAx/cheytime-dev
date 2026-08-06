# Admin Panel — Plan

Status of the Supabase migration, and the plan for bringing the admin panel
into this codebase.

---

## 1. Where things actually stand

### Done and pushed

| Piece | State |
| --- | --- |
| Typed server + browser Supabase clients (`lib/supabase/`) | Done |
| `database.types.ts` copied from the legacy repo, kept in sync | Done |
| Loaders for Music, Store, Events, Archive, Press (`lib/loaders/`) | Done |
| `getSections()` overlaying live rows on the static baseline | Done |
| Contact form posting to `contact_submissions` | Done |
| Press section (XI) + `press_features` table and migration | Done |
| Full migration history mirrored into `supabase/migrations/` | Done |
| ISR at 60s, route builds `○ Static` | Done |

### Not done

| Piece | State |
| --- | --- |
| **Admin panel in this repo** | **Not started** — see §3 |
| Verification against the live database | **Blocked** — see §2 |
| Product imagery in the Store panel | Not started — `merch_products.image_url` is read but discarded, because `Product` has no image field and the renderer draws a numbered placeholder tile. Adding it means touching `StoreBlock`. |
| The three EPK videos (`SIcEPXmavDk`, `lXucfyLDE7M`, `xAkX2h97qeE`) | Not added — Music is DB-driven now, so these belong in `music_releases` via the admin, not in a static list. |
| Page 1 of `CHEY2026.pdf` | Not migrated — it is a single full-bleed image and could not be extracted in this environment. If it carries copy, that copy is not on the site. |

---

## 2. Verification — read this before trusting the data layer

**The loaders have never executed against real rows.** The build environment
blocks egress to `enhduflezmiugpjaovhz.supabase.co`, so every loader fell back
to its static content during every build. The queries are typed against the
real schema and mirror the legacy `useSupabaseQuery` hooks, but that is
correctness by construction, not by observation.

First deploy to an environment with network access, then check in this order:

1. **Env present.** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   set in the host. Missing values log a warning and silently serve static
   content — the site looks fine while being stale, so check the logs.
2. **No loader warnings.** Any `[loaders] … failed — using static content` line
   in the build output means that section is not live.
3. **Per section:** Music lists the releases from the admin; Store matches
   `merch_products` where `active = true`; Events shows only published, future
   dates; Contact's archive grid matches `gallery_items`; Press lists the four
   seeded features.
4. **Round trip.** Edit a row in the legacy admin, wait ~60s, reload. The change
   should appear. If it does not, ISR is not revalidating.
5. **Contact form.** Submit it, confirm the row lands in `contact_submissions`.

### Known sharp edge: ISR vs. admin edits

Reads deliberately use a **cookie-free** client (`createStaticClient`). Touching
`cookies()` opts a route out of static rendering entirely and silently converts
`revalidate = 60` into render-on-demand — which is what the first build of this
work did before it was caught.

The consequence: **an admin edit takes up to 60s to appear.** That is the
intended tradeoff for a marketing site. When the admin moves into this repo,
§3.5 removes the wait for edits made here.

---

## 3. Admin panel plan

The legacy admin is a single 1380-line `src/pages/Admin.tsx` in the old repo —
a tabbed CRUD surface over the same tables this site now reads. The goal is to
port it to the App Router, not to redesign it.

### 3.1 Auth

The schema already has everything: a `user_roles` table, a `has_role()`
function, and RLS on every table gating writes behind
`has_role(auth.uid(), 'admin')`. **No new policies are needed** — a logged-in
admin's writes are authorised by the database, not by the UI.

- Sign-in with Supabase Auth (email + password) at `/admin/login`.
- `middleware.ts` to refresh the session cookie on `/admin/*`. This is what the
  cookie-aware `createClient()` in `lib/supabase/server.ts` was built for — it
  is currently unused and exists for exactly this step.
- A server-side guard in `app/admin/layout.tsx`: read the user, check
  `user_roles`, redirect non-admins. Treat this as UX, not security; RLS is the
  real boundary.
- **All `/admin/*` routes must be dynamic.** They read cookies, so they opt out
  of static rendering by nature. Never put `revalidate` on them.

### 3.2 Routes

```
app/admin/login/page.tsx      sign in
app/admin/layout.tsx          auth guard + nav shell
app/admin/page.tsx            dashboard: counts, unread messages
app/admin/music/page.tsx      music_releases  (albums + child tracks)
app/admin/store/page.tsx      merch_products
app/admin/events/page.tsx     events
app/admin/press/page.tsx      press_features
app/admin/gallery/page.tsx    gallery_items
app/admin/messages/page.tsx   contact_submissions (read + mark read)
```

### 3.3 Writes

Server Actions rather than client-side mutations — writes stay on the server,
and revalidation is a direct call rather than a round trip.

```ts
"use server";
export async function upsertPressFeature(input: PressInput) {
  const db = await createClient();          // cookie-aware, carries the session
  const { error } = await db.from("press_features").upsert(input);
  if (error) throw error;
  revalidatePath("/");                       // public site picks it up now
  revalidatePath("/admin/press");
}
```

Validate inputs server-side. RLS will reject an unauthorised write regardless,
but a clear error beats a generic policy violation.

### 3.4 Uploads

Artwork and gallery images go to the existing public `site-assets` bucket
(`music-files` is the private one behind `secure-download`). Storage RLS is
already in place. Upload from the client with the browser client, then write
the returned public URL to the row.

`next.config.ts` already allows `*.supabase.co/storage/v1/object/public/**`, so
uploaded images render through `next/image` with no further config.

### 3.5 Killing the 60s lag

Every Server Action calls `revalidatePath("/")`, so edits made in **this**
admin appear immediately. Edits made in the **legacy** admin still take up to
60s, since that app cannot call into this one. If that becomes a problem, a
Supabase webhook hitting a `/api/revalidate` route handler closes the gap.

### 3.6 Sequencing

1. `middleware.ts` + login + `/admin` guard — nothing else works without it.
2. Press and Events. Smallest schemas, and Press has no legacy admin to port,
   so it is the cleanest place to establish the CRUD pattern.
3. Store and Gallery. Adds the upload path.
4. Music. Hardest — the album/track parent-child relationship needs real UI.
5. Messages. Read-only plus a `read` toggle.
6. Retire the legacy admin once every tab has an equivalent here.

### 3.7 Decisions still needed

- **Does the legacy admin get retired, or do both run?** Both writing to one
  database is fine, but two UIs drift. Recommend retiring the old one after §3.6.
- **Who gets an admin account?** Rows must be added to `user_roles` by hand;
  there is no invite flow.
- **Store checkout.** The Stripe edge functions live in the legacy repo and are
  not wired here. The Store panel's Reserve button is still local-only state.

---

## 4. Content to confirm with the client

- **Press headlines were derived from URL slugs**, not from the articles. Worth
  checking against the live pages.
- **Contact email** is now `Smgproductions2024@gmail.com`, taken from the 2026
  press kit, replacing the placeholder `contact@cheymusic.com`.
- **Spotify and Apple Music** are still `url: null` — they render as
  "· soon" chips. Real URLs would fill them in.

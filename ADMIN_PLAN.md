# Admin Panel, Plan

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
| **Admin panel at `/admin`** | Built, see §3. Ten tabs, one per table the legacy admin managed. |

### Not done

| Piece | State |
| --- | --- |
| Verification against the live database | **Done**, 2026-06-10, see §2 |
| Signing into the admin end to end | **Still blocked**, needs admin credentials. The guard and login render, and reads are proven, but no CRUD action has been run against a real row. |
| Product imagery in the Store panel | **Done**, `Product` carries an optional `image`, the loader passes `image_url` through `renderableImage()`, and the numbered plate is now the fallback rather than the only option. |
| The three EPK videos (`SIcEPXmavDk`, `lXucfyLDE7M`, `xAkX2h97qeE`) | **Two are in** `music_releases`, `lXucfyLDE7M` as "Sway in the morning freestyle", `xAkX2h97qeE` as "CHEY - Hair and Nails". `SIcEPXmavDk` appears nowhere and is still unaccounted for. |
| Page 1 of `CHEY2026.pdf` | Not migrated, it is a single full-bleed image and could not be extracted in this environment. If it carries copy, that copy is not on the site. |

---

## 2. Verification, read this before trusting the data layer

**Done, 2026-06-10.** This section used to say the loaders had never executed
against real rows, because the environment could not reach
`enhduflezmiugpjaovhz.supabase.co`. That is no longer true. With `.env.local`
set, all twelve content tables answered and a full build logged **no**
`[loaders] … using static content` lines, so every section read live. Row
counts are recorded in `HANDOFF.md`, and they contradict several statements
written while this was still unverified, most importantly that
`music_releases` was empty. It is not; `music_links` is.

What that pass found, beyond "it works": `merch_products.image_url` was
populated but discarded by the loader, so uploaded product photography never
reached the page; and seven `gallery_items` rows held Instagram permalinks
rather than images and were being dropped entirely. Both are fixed. The lesson
is the general one, correctness by construction had held for the *queries*,
but not for what the app then did with the rows.

The checklist below stays useful for every new environment:

1. **Env present.** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   set in the host. Missing values log a warning and silently serve static
   content, the site looks fine while being stale, so check the logs.
2. **No loader warnings.** Any `[loaders] … failed, using static content` line
   in the build output means that section is not live.
3. **Per section:** Music lists the releases from the admin; Store matches
   `merch_products` where `active = true` and shows their photographs; Events
   shows only published, future dates; Gallery matches `gallery_items`, with
   the Instagram rows under "Elsewhere"; Press lists the seeded features.
4. **Round trip.** Edit a row in the legacy admin, wait ~60s, reload. The change
   should appear. If it does not, ISR is not revalidating.
5. **Contact form.** Submit it, confirm the row lands in `contact_submissions`.

### Known sharp edge: ISR vs. admin edits

Reads deliberately use a **cookie-free** client (`createStaticClient`). Touching
`cookies()` opts a route out of static rendering entirely and silently converts
`revalidate = 60` into render-on-demand, which is what the first build of this
work did before it was caught.

The consequence: **an admin edit takes up to 60s to appear.** That is the
intended tradeoff for a marketing site. When the admin moves into this repo,
§3.5 removes the wait for edits made here.

---

## 3. Admin panel, as built

Ported from the legacy `src/pages/Admin.tsx` (a single 1380-line tabbed CRUD
surface) to the App Router at `/admin`. Same database, same tables, same job.

Two things changed in the port:

**Tabs are named by clock hour, not by page.** The old admin mirrored the old
site's pages; the new site renders hours, so each tab names the numeral it
feeds, Music IV, Store VI, Events VIII, Archive X, Press XI. Tabs with no
numeral (Submissions, Blog, Digital, Outreach, Purchases) say in the tab
itself where they do and don't surface, so it is clear that editing Blog
changes the database but nothing visible.

**One schema-driven editor instead of a component per table.** Adding a field
to `lib/admin/schema.ts` adds it to the form, the create defaults and the save
payload. There is no per-table component to keep in step.

### 3.1 Auth

The schema already has everything: a `user_roles` table, a `has_role()`
function, and RLS on every table gating writes behind
`has_role(auth.uid(), 'admin')`. **No new policies are needed**, a logged-in
admin's writes are authorised by the database, not by the UI.

- Sign-in with Supabase Auth (email + password) at `/admin/login`.
- `middleware.ts` to refresh the session cookie on `/admin/*`. This is what the
  cookie-aware `createClient()` in `lib/supabase/server.ts` was built for, it
  is currently unused and exists for exactly this step.
- A server-side guard in `app/admin/layout.tsx`: read the user, check
  `user_roles`, redirect non-admins. Treat this as UX, not security; RLS is the
  real boundary.
- **All `/admin/*` routes must be dynamic.** `app/admin/layout.tsx` declares
  `export const dynamic = "force-dynamic"` for the whole subtree. Reading
  cookies does opt a route out of static rendering, but only as a side effect,
  and that broke: `getAdminUser()` returns early when Supabase env is missing,
  before it touches `cookies()`, so `/admin` prerendered. Because
  `NEXT_PUBLIC_*` is inlined at build time, a production build without env
  would bake a redirect-to-login into the route and keep serving it after env
  was fixed, every admin locked out by a missing variable. Never put
  `revalidate` on these routes.

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

Server Actions rather than client-side mutations, writes stay on the server,
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

The shared upload path runs JPEGs through `lib/admin/image-upload.ts` first.
It caps the longest edge at 2400px and uses 82% JPEG quality when recompression
reduces the file size. Other image types and audio files are not transformed.

`next.config.ts` already allows `*.supabase.co/storage/v1/object/public/**`, so
uploaded images render through `next/image` with no further config.

### 3.5 Killing the 60s lag

Every Server Action calls `revalidatePath("/")`, so edits made in **this**
admin appear immediately. Edits made in the **legacy** admin still take up to
60s, since that app cannot call into this one. If that becomes a problem, a
Supabase webhook hitting a `/api/revalidate` route handler closes the gap.

### 3.6 Known rough edges

- **Music album nesting is by ID, not by picker.** Nesting a track under an
  album means pasting the album's `parent_album_id`. It works, but it is the
  one place the port is clumsier than it should be.
- **No bulk upload.** The legacy admin takes a folder of gallery images or
  audio at once; this one is a file at a time. Last remaining difference, and
  the only thing the legacy admin still does better.
- **No optimistic UI.** Every save round-trips and then refreshes the route.
  Correct, but it feels slower than the old client-side admin on a slow link.

### 3.7 Granting admin access

Deliberately locked down: **there is no invite flow and no self-serve signup
path into the admin.** Access is granted in two manual steps, both in the
Supabase dashboard.

1. **Create the user** under Authentication → Users → Add user. Set a password
   and confirm the email; an unconfirmed user cannot sign in.
2. **Grant the role** in the SQL editor. Looking the user up by email avoids
   copying UUIDs around, and `user_roles` has a `UNIQUE (user_id, role)`
   constraint, so re-running this is harmless:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'person@example.com'
on conflict (user_id, role) do nothing;
```

To revoke, delete the row, the session dies at its next refresh, within the
hour:

```sql
delete from public.user_roles
using auth.users
where user_roles.user_id = auth.users.id
  and auth.users.email = 'person@example.com'
  and user_roles.role = 'admin';
```

Notes:

- `app_role` is an enum of `admin | moderator | user`. Only `admin` grants
  anything, the other two are unused by both apps.
- Creating an account without the role is safe. They can sign in, get bounced
  straight back to the login form, and every write they attempt fails RLS.
- If public signups are enabled on the project, that remains true, an account
  alone grants nothing. Worth disabling anyway if nothing else needs it.

### 3.8 Decisions still needed

- **Does the legacy admin get retired, or do both run?** Both writing to one
  database is fine, but two UIs drift. Recommend retiring the old one now that
  this panel covers every table it managed.
- **Store checkout.** The Stripe edge functions live in the legacy repo and are
  not wired here. The Store panel's Reserve button is still local-only state.
- **Blog and Digital have no home on the clock.** They are editable here but
  nothing renders them. Either give them an hour or accept they are dormant.

---

## 4. Supabase reference

One project serves both codebases. An edit in either admin hits the same rows.

| | |
| --- | --- |
| Project ID | `enhduflezmiugpjaovhz` |
| URL | `https://enhduflezmiugpjaovhz.supabase.co` |
| Dashboard | `https://supabase.com/dashboard/project/enhduflezmiugpjaovhz` |
| Config | `supabase/config.toml` (this repo) |
| Migrations | `supabase/migrations/`, mirrored from the legacy repo, schema of record |

### Keys

Set in `.env.local` (gitignored); template in `.env.local.example`.

```
NEXT_PUBLIC_SUPABASE_URL=https://enhduflezmiugpjaovhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

Both are public by design, the anon key is shipped to the browser and every
table is guarded by RLS. Find them under Project Settings → API.

**The service role key belongs to neither codebase.** It bypasses RLS
entirely. It lives only in the edge functions' own environment, where Supabase
injects it. Never put it in `.env.local`, and never in a `NEXT_PUBLIC_*` var.

### Tables

| Table | Feeds | Notes |
| --- | --- | --- |
| `music_releases` | Album (III) + Music (IV) | `parent_album_id` nests tracks. Album/mixtape rows can use the official Apple Music embed; YouTube links embed for loose tracks. |
| `merch_products` | Store (VI) | `active = true` only. |
| `events` | Events (VIII) | Published + future only; RLS enforces published. |
| `gallery_items` | Gallery (IX) | Images render in the grid; Instagram permalinks render as link cards. |
| `press_features` | Press (XI) | Added in this migration; published + linked only. |
| `blog_posts` | Blog (I) | |
| `music_products` | Digital (VII) | Paid downloads; checkout not wired here. |
| `contact_submissions` |, | Contact form writes; anon INSERT, admin SELECT. |
| `outreach_logs` |, | Internal PR pipeline, admin-only. |
| `purchases` |, | Stripe webhook writes. No admin UPDATE/DELETE policy. |
| `user_roles` |, | Admin grants. See §3.7. |

### Storage

| Bucket | Public | Use |
| --- | --- | --- |
| `site-assets` | Yes | Artwork, gallery and product images. |
| `music-files` | Yes | Audio, full tracks and preview clips. |

⚠️ **Both buckets are `public = true`.** `music-files` does not withhold a paid
track from anyone holding its URL; `secure-download` issues tokens, but the
bucket itself does not check them. The site never renders `audio_url` (see
`lib/loaders/digital.ts`), so the URLs are not discoverable from the page,
but that is obscurity, not access control. Making the bucket private is a
migration that would also affect the legacy repo's download flow, so it is
flagged rather than changed.

`next.config.ts` allows `*.supabase.co/storage/v1/object/public/**`, so anything
uploaded renders through `next/image` with no further config.

### Edge functions

Deployed from the **legacy repo** (`supabase/functions/`), not from here:

- `admin-auth`, verifies the JWT and checks the admin role with the service
  role. This site's guard calls its `login-check` action.
- `create-checkout-session`, `stripe-webhook`, Stripe. Not wired to this site.
- `secure-download`, issues download tokens for purchased audio.

### RLS shape

Consistent across content tables: **public SELECT** (sometimes narrowed to
`published = true`), **all writes gated** behind
`has_role(auth.uid(), 'admin')`. That is why the admin needs no new policies,
and why a leaked anon key does not expose writes.

---

## 5. Content to confirm with the client

- **Press headlines were derived from URL slugs**, not from the articles. Worth
  checking against the live pages.
- **Contact email** is now `Smgproductions2024@gmail.com`, taken from the 2026
  press kit, replacing the placeholder `contact@cheymusic.com`.
- **Spotify and Apple Music** are still `url: null`, they render as
  "· soon" chips. Real URLs would fill them in.

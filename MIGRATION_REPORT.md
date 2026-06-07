# CheyTime — Migration & Discovery Report

**Date:** 2026-06-06
**Author:** Discovery audit for the `cheytime-dev` rebuild
**Sources audited:**
1. Live site — https://cheytime.com/ (current production, JS-rendered SPA)
2. Legacy repository — `/Users/moinulk/Documents/chey-music` (Vite + React + shadcn + Supabase, deployed to chey-music.netlify.app)
3. Design / asset files — `chey-music/src/assets/*` and `chey-music/public/*` (no separate design folder exists)

> **Scope note from client:** Supabase is currently a *mock* and will be integrated later. For this rebuild, the legacy repo is the authoritative **content source**, and all content is hard-coded into a typed config (`lib/sections.ts`) structured so it can later be swapped for Supabase queries with no UI changes.

---

## 1. Brand Reconciliation (important)

There are **two brand identities** in the source material, and they conflict. This is the single most important finding.

| Aspect | Legacy repo (`chey-music`) | Live site (`cheytime.com`) — **NEWER, canonical** |
|---|---|---|
| Name | "CHEY MUSIC" | **"Chey Time"** / "Chey's Time" |
| Positioning | "Architect of sound", "Raw / Uncut", "No Compromise" | **"Hip Hop's Princess"**, **Staten Island rapper** |
| Tone | Brutalist, abrasive, "founded in refusal" | "relatable lyricism with upbeat, captivating production" |
| Aesthetic | Light bone-white bg, black brutalism, radius 0, no shadows, pink accent | (rebrand — premium/regal implied) |

**Decision:** Adopt the **live-site brand** (`Chey Time` / "Hip Hop's Princess" / Staten Island) as canonical identity, and the **rebuild brief's aesthetic** (luxury, cinematic, dark, premium, mysterious; diamond/silver numerals; deep-black + purple-cosmic; the "Chey's Time" interactive clock). Legacy *copy* (manifesto, track names, merch, credits) is migrated where it fits the elevated tone; the legacy *visual language* (brutalist light theme) is **not** carried over.

---

## 2. Existing Pages (legacy routes)

| Route | Page | Migrates to clock section |
|---|---|---|
| `/` | Index (hero) | **XII → Home** |
| `/about` | About — "The Manifesto" | **II → About** |
| `/music` | Music — "The Sound" | **IV → Music** |
| `/merch` | Merch — "The Objects" | **VI → Store** |
| `/events` | Events — "Upcoming" | **VIII → Events** |
| `/contact` | Contact — "Get in Touch" | **X → Contact / Archive** |
| `/gallery` | Gallery — "The Archive" | folded into **X** (Archive) |
| `/blog`, `/blog/:slug` | Blog / BlogPost | optional — folded into About/Archive as journal entries |
| `/portfolio` | Portfolio | legacy/unused — not migrated |
| `/admin` | Admin CMS (Supabase) | out of scope (mock Supabase, later) |

---

## 3. Existing Content (verbatim, migratable)

### Artist bio / descriptor (from live site `<meta>` — canonical)
> "Chey Time — Hip Hop's Princess. Staten Island rapper blending relatable lyricism with upbeat, captivating production. Stream music, shop merch, and catch live events."

### About / Manifesto (legacy copy)
- "Chey. Architect of sound. Blending raw lyricism with heavy, uncompromising production."
- "Chey Music was born from a rejection of the polished and predictable…"
- Quote: *"The mic captures the exact frequency of the room. The imperfections are intentional."*
- Credits: Artist — Chey · Visuals — Studio Null · Production — Chey · Direction — Chey · Web — rummspace

### Hero copy (legacy)
- "Raw Sound — No Compromise" · "2026 — The Frequency"
- Quote: *"The raw vocal is the final architecture. No overwriting, no polishing the edges to make them comfortable."*
- Data strip: Based — Worldwide · Genre — Raw / Uncut · Latest — "Poppin' — 2026" · Direction — Chey

### Blog / journal posts (3, with full bodies)
1. **Off the Dome: The Freestyle Tapes** (2026.02.27) — "Poppin'" & "Long Kiss Goodnight" recorded in single takes.
2. **The Live Room: No Backing Tracks** (2026.02.25)
3. **'Absence' Visual Identity & Merch** (2026.02.10)

---

## 4. Existing Music Links

- **YouTube channel:** https://www.youtube.com/@cheymusic127
- **Seeded YouTube videos (IDs):** `29vWUXMTkME`, `OamCSPuswjg`, `4T6mFd2Sz_Y`, `l62mMBXck70`
- **Known tracks:** "Poppin'" (2026), "Long Kiss Goodnight" (2025)
- **Platforms the legacy player supports:** YouTube, Spotify, Apple Music, iTunes (only YouTube IDs were actually seeded; Spotify/Apple links **missing**).

## 5. Existing Store / Merch (with prices)

| Product | Price | Material |
|---|---|---|
| Construct Tee — Black | $65 | Cotton 220gsm |
| Volume VII Hoodie | $120 | French Terry 350gsm |
| Scaffold Cap | $45 | Washed Canvas |
| Absence Longsleeve | $75 | Cotton 200gsm |
| Raw Print Tote | $35 | Heavy Canvas |
| Material Tension Poster | $25 | 70×100cm Matte |

> Checkout was Stripe via a Supabase Edge Function (`create-checkout-session`). Out of scope now; Store renders products + "Add to cart" stub.

## 6. Existing Contact Information
- **Email:** `contact@cheymusic.com` (legacy) — *flagged for client confirmation; may need a `@cheytime.com` address.*
- Form fields: Name, Email, Subject, Message (Zod-validated) → Supabase + EmailJS. Rebuild keeps the validated form UI; submission wiring deferred with Supabase.
- Response SLA copy: "We will respond within 48 hours."

## 7. Existing Social Links
- **YouTube:** @cheymusic127 (confirmed)
- **Instagram:** referenced (gallery had IG-embed support) but **no handle found** — *MISSING, placeholder.*
- TikTok / Spotify / Apple artist pages — **MISSING.**

## 8. Existing Imagery / Assets
- `src/assets/editorial-1.jpg` — full-length B&W of a woman in a long dark coat (concrete underpass). **Primary silhouette reference for the clock figure.**
- `src/assets/editorial-2.jpg` — B&W close-up of ringed hands (diamond/silver rings — ties to "diamond numerals" motif).
- `src/assets/editorial-3.jpg` — B&W of a woman in flowing dark chiffon, dynamic motion (arm/fabric extended — motion reference).
- `public/og-image.png` — "CHEY MUSIC" wordmark, white-on-black (will be regenerated for "Chey Time").
- `public/favicon.svg` — black square, serif white "C".

## 9. Events
- Events table exists but **no events seeded** → render an elegant "No upcoming events — check back soon" empty state (clearly labeled placeholder). One historical reference: an April Berlin booking inquiry (not a confirmed event).

## 10. Existing Functionality (legacy)
Smooth scroll (Lenis), custom cursor, film-grain overlay, page loader, vertical nav marquee, scroll-reveal, cart drawer + floating cart button, Supabase-backed CMS/admin, Stripe checkout, EmailJS contact, view counter, Instagram/Spotify/Apple/YouTube embeds, blog. **None of the brutalist UI is reused**; relevant *capabilities* (embeds, contact form, reveal motion) are re-expressed in the new premium clock experience.

## 11. Missing Assets / Content (gaps → placeholders, clearly labeled)
- Clean artist cut-out / silhouette source (photos are full-scene, not isolated) → **hand-authored SVG silhouette** of a feminine figure with a separable raised arm.
- Purple-cosmic background image → CSS/gradient cosmic background as default; `public/` image slot provided.
- Spotify / Apple Music / Instagram / TikTok URLs → placeholders.
- Real upcoming events → placeholder empty state.
- Confirmed contact email on the cheytime.com domain → placeholder `contact@cheytime.com` (TODO: confirm).
- High-res OG image for "Chey Time" → regenerate.

---

## 12. Clock Navigation Map (target IA)

| Numeral | Angle | Section | Title | Source content |
|---|---|---|---|---|
| **XII** | 0° | Home | "Chey's Time" | Hero / landing |
| **II** | 60° | About | "The Manifesto" | About bio + manifesto + credits |
| **IV** | 120° | Music | "The Sound" | YouTube channel + videos + tracks |
| **VI** | 180° | Store | "The Objects" | 6 merch products |
| **VIII** | 240° | Events | "Upcoming" | Empty-state placeholder |
| **X** | 300° | Contact / Archive | "Transmission" | Contact form + gallery archive |

Numerals **I, III, V, VII, IX, XI** remain visible but inactive (decorative).

---

## 13. Recommended Stack (per brief, confirmed feasible)
Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · next/font (Playfair Display + Inter) · next/image · ESLint. Interactivity isolated to client components; the page shell stays server-rendered.

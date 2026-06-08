# Chey Time — *Chey's Time*

An immersive, single-interaction artist site for **Chey** — "Hip Hop's Princess," a Staten Island rapper. The entire experience is a full-screen interactive clock: a faceted diamond hand sits at the centre over a tick dial, and diamond Roman numerals form the navigation. Selecting a numeral sweeps the hand to that hour and reveals a frosted-glass content panel.

Built as a ground-up rebuild of the legacy `chey-music` site. See [`MIGRATION_REPORT.md`](./MIGRATION_REPORT.md) for the full discovery/content audit.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3 · Framer Motion 11 · `next/font` (Playfair Display + Inter) · `next/image` · ESLint.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
npm run typecheck
```

Status: `dev`, `build`, `lint`, and `typecheck` all pass clean — zero TS/ESLint errors, no `create-next-app` boilerplate.

## Architecture

```
app/
  layout.tsx        fonts (next/font) + SEO metadata
  page.tsx          server shell: mounts background + clock
  globals.css       theme tokens, glass, metallic, reduced-motion
  icon.svg          favicon (clock motif)
components/
  CosmicBackground  z-0  · next/image backdrop + animated CSS smoke/stars
  ClockFace         z-2  · static tick dial (60 ticks, hours elongated)
  ClockHand         z-20 · the faceted diamond hand (rotates)
  RomanNumerals     z-30 · 12 numerals on a polar ring, 6 interactive
  CheysClock             · orchestrator: measures stage, rotates hand, state
  ContentPanel      z-40 · glass slide-over (desktop) / bottom sheet (mobile)
  SectionContent         · per-section renderers (about/music/store/…)
lib/
  sections.ts       single content source → all navigation
  clock.ts          geometry (polar positions) + pivot/spring constants
types/
  section.ts        typed, discriminated section model
```

Only the clock and panel are client components; everything else is server-rendered. The page is statically prerendered.

## Adding / editing navigation

Everything is driven by the typed `SECTIONS` array in [`lib/sections.ts`](./lib/sections.ts) — `{ id, numeral, hourIndex, angle, title, subtitle, data }`. Angles are derived once from `hourIndex` via `angleForHour()`; nothing re-declares them. Add a section by adding one entry (and a `case` in `SectionContent`).

## Tuning the hand

The hand pivot is the single knob, in [`lib/clock.ts`](./lib/clock.ts):

```ts
export const PIVOT = { x: 500, y: 500 };           // in the 1000×1000 design space
export const HAND_TRANSFORM_ORIGIN = "50% 50%";    // == PIVOT as % of the stage
export const HAND_SPRING = { type: "spring", stiffness: 45, damping: 14, mass: 1.1 };
```

`ClockHand` and `ClockFace` share that 1000×1000 space, so the hand always centres. The hand animates **rotation only** (`will-change: transform`); position/size never animate. `XII = 0°` (straight up); selecting XII / closing returns home to 0°.

## Performance & accessibility

- Animates only `transform` / `opacity`; targets 60fps.
- Honours `prefers-reduced-motion` — springs become simple fades.
- Geometry is measured (ResizeObserver) + polar-computed, so the clock stays correct at every size; never overflows or clips the arm.
- Numerals are real buttons with `aria-label` / `aria-current`; the panel is a focus-trapped `role="dialog"` closable via button, Escape, or backdrop, and restores focus on close.
- YouTube embeds use a click-to-load facade (poster → iframe) to keep first load light.

## Content & data

All copy/links are migrated real content (YouTube `@cheymusic127`, the "Poppin'"/"Long Kiss Goodnight" videos, merch with prices, credits, contact). **Supabase is currently a mock** — content is hard-coded in `lib/sections.ts` with shapes mirroring the future DB tables, so wiring it up later is mechanical. Clearly-labelled placeholders mark missing data (Spotify/Apple/Instagram links, upcoming events, product imagery). The cosmic backdrop and contact email are placeholders pending real assets / client confirmation.

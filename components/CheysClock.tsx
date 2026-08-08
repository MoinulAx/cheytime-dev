"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ClockFace from "./ClockFace";
import ClockHand from "./ClockHand";
import SecondsHand from "./SecondsHand";
import RomanNumerals from "./RomanNumerals";
import ContentPanel from "./ContentPanel";
import { homeSection, sectionById, sectionByHour } from "@/lib/sections.static";
import { HAND_SPRING, HAND_TRANSFORM_ORIGIN } from "@/lib/clock";
import { clockStageMotion } from "@/lib/panel";
import type { Section, SectionId } from "@/types/section";

/** Measure a square clock stage that always fits the viewport. */
function useStageSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Reserve vertical room below the clock for the home copy so the
      // numerals and their labels never collide with it. Bumped larger so the
      // dial is the clear centrepiece over the portrait backdrop.
      setSize(Math.min(width * 0.96, height * 0.78, 820));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

/** Viewport width, so the open-panel layout can size against the real screen. */
function useViewportWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

/** Simple media-query hook (post-mount, SSR-safe). */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

interface CheysClockProps {
  /**
   * The resolved twelve-hour config, built on the server by `getSections()`.
   * Passed in rather than imported so the DB-backed sections carry live
   * content; the geometry is identical either way.
   */
  sections: Section[];
}

/**
 * CheysClock — the full interactive experience, set like a magazine spread:
 * masthead rule across the top, the quiet dial centre-stage over Chey's
 * portrait, and the home copy anchored to the bottom corners (never centred
 * under the dial, so nothing overlaps the numerals).
 *
 * Layers (z): 0 background (page) · 1 face ring · 2 dial marks · 19 live
 * seconds · 20 hand · 21 hub · 30 numerals · 40 content panel. The hand
 * rotates (only) to the selected section's angle on an escapement spring;
 * selecting XII / closing the panel returns it home to 0°.
 */
export default function CheysClock({ sections }: CheysClockProps) {
  const reduce = useReducedMotion();
  const { ref, size: stageSize } = useStageSize();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const viewportWidth = useViewportWidth();

  // null === Home / base immersive state (hand at 0°, no panel).
  const [selectedId, setSelectedId] = useState<SectionId | null>(null);

  const home = homeSection(sections);
  const selected = (selectedId ? sectionById(sections, selectedId) : null) ?? null;
  const activeHour = selected ? selected.hourIndex : home.hourIndex;
  const handAngle = selected ? selected.angle : home.angle;
  const isOpen = selected !== null;

  const handleSelect = useCallback(
    (hourIndex: number) => {
      const section = sectionByHour(sections, hourIndex);
      if (!section) return;
      // XII (Home) acts as the reset — close any open panel.
      setSelectedId(section.id === "home" ? null : section.id);
    },
    [sections],
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);
    // Drop the deep-link fragment so a reload does not reopen a panel the
    // visitor just closed. replaceState, not push — closing a drawer is not a
    // navigation and should not add a history entry to back out of.
    if (window.location.hash) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", pathname + search);
    }
  }, []);

  /**
   * Deep link: `/#blog` opens that section on arrival.
   *
   * This is how the Journal pages get back to the panel they came from —
   * "back to the clock" has to mean the tab you left, not a reset dial.
   *
   * The fragment rather than a query parameter because reading `searchParams`
   * in `app/page.tsx` would opt the home page out of static rendering, and it
   * has to stay `○ Static` on a 60s revalidate. A hash never reaches the
   * server, so the page stays cacheable and this runs on the client.
   */
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "").trim();
    if (!id) return;
    const target = sectionById(sections, id as SectionId);
    if (target && target.id !== "home") setSelectedId(target.id);
  }, [sections]);

  const homeData = home.data.kind === "home" ? home.data : null;

  // Shift/scale the clock so it stays visible while the panel is open. On
  // desktop the dial re-centres into the strip left of the panel, so widening
  // the panel can never crowd it.
  const stageMotion = !isOpen
    ? { x: 0, y: 0, scale: 1 }
    : isDesktop
      ? clockStageMotion(viewportWidth, stageSize)
      : { x: 0, y: -stageSize * 0.16, scale: 0.82 };

  const ringDiameter = stageSize * 0.86;

  return (
    <div
      ref={ref}
      className="relative z-10 flex h-dvh w-full items-center justify-center overflow-hidden pb-28 pt-10 md:pb-24 [@media(max-height:480px)_and_(max-width:1023px)]:pb-10"
    >
      {/* Masthead — full-width editorial header rule, always visible */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-5 pt-4 md:px-8 md:pt-5">
        <div className="flex items-baseline justify-between pb-3">
          <p className="font-display text-xl font-bold italic leading-none text-bone-50 md:text-2xl">
            Chey&apos;s&nbsp;Time
          </p>
          <p className="eyebrow hidden sm:block">
            Hip Hop&apos;s Princess&ensp;—&ensp;Staten Island, NY
          </p>
          <p className="eyebrow sm:hidden">Hip Hop&apos;s Princess</p>
        </div>
        <div className="rule" />
      </header>

      {/* The clock stage — lifted above the backdrop while open so the lit
          clock stays interactive (you can jump straight to another hour). */}
      <motion.div
        className={`relative will-change-transform ${isOpen ? "z-[45]" : "z-10"}`}
        style={{ width: stageSize, height: stageSize }}
        animate={stageMotion}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 80, damping: 18 }
        }
      >
        {stageSize > 0 && (
          <>
            {/* z-1 — single hairline face ring */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone-100/15"
              style={{ width: ringDiameter, height: ringDiameter }}
            />

            {/* z-2 — static dial marks */}
            <div className="absolute inset-0 z-[2]">
              <ClockFace className="h-full w-full" />
            </div>

            {/* z-[19] — live seconds, ticking real time beneath the hand */}
            <SecondsHand className="absolute inset-0 z-[19] h-full w-full" />

            {/* z-20 — clock hand (rotates only, around the central pivot) */}
            <motion.div
              className="absolute inset-0 z-20 drop-glow will-change-transform"
              style={{ transformOrigin: HAND_TRANSFORM_ORIGIN }}
              initial={false}
              animate={{ rotate: handAngle }}
              transition={reduce ? { duration: 0 } : HAND_SPRING}
            >
              <ClockHand className="h-full w-full" />
            </motion.div>

            {/* z-[21] — jewelled centre hub (static, sits over the hand base) */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-[21] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: stageSize * 0.05,
                height: stageSize * 0.05,
                background:
                  "radial-gradient(circle at 38% 32%, #ffffff 0%, #cdd2da 38%, #5b626e 100%)",
                boxShadow:
                  "0 0 18px rgba(168,85,247,0.7), inset 0 0 6px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cosmic-500"
                style={{ width: "34%", height: "34%" }}
              />
            </div>

            {/* z-30 — numerals */}
            <RomanNumerals
              sections={sections}
              stageSize={stageSize}
              activeHour={activeHour}
              onSelect={handleSelect}
            />
          </>
        )}
      </motion.div>

      {/* Home / base copy — anchored to the bottom corners (clear of the
          dial), fades out when a section opens */}
      <AnimatePresence>
        {!isOpen && stageSize > 0 && (
          <motion.div
            key="home-overlay"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-5 pb-6 md:px-8 md:pb-7"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Data strip — the legacy home facts. Hidden on small screens,
                where it would collide with the dial rather than sit under it. */}
            {homeData && homeData.facts.length > 0 && (
              <div className="mb-3 hidden items-baseline justify-between gap-6 md:flex">
                {homeData.facts.map((f) => (
                  <div key={f.label} className="min-w-0">
                    <p className="font-sans text-[9px] uppercase tracking-luxe text-bone-600">
                      {f.label}
                    </p>
                    <p className="mt-0.5 truncate font-sans text-[11px] text-bone-300">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="rule mb-4" />
            <div className="flex items-end justify-between gap-4">
              {/* Build credit — quiet, bottom-left, clear of the dial. */}
              <p className="font-sans text-[10px] uppercase tracking-wide2 text-bone-600">
                Site by{" "}
                <a
                  href="https://rummspace.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto transition-colors hover:text-bone-300"
                >
                  rummspace
                </a>
              </p>
              <div className="flex items-baseline justify-between gap-4 md:w-auto md:flex-col md:items-end md:gap-1.5">
                <p className="eyebrow text-bone-100">{homeData?.cue}</p>
                <p className="font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                  {homeData?.location}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* z-40 — content panel */}
      <ContentPanel section={selected} isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ClockFace from "./ClockFace";
import ClockHand from "./ClockHand";
import RomanNumerals from "./RomanNumerals";
import ContentPanel from "./ContentPanel";
import { HOME_SECTION, sectionById, sectionByHour } from "@/lib/sections";
import { HAND_SPRING, HAND_TRANSFORM_ORIGIN } from "@/lib/clock";
import type { SectionId } from "@/types/section";

/** Measure a square clock stage that always fits the viewport. */
function useStageSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Reserve vertical room (≈28%) below the clock for the home copy so the
      // numerals and their labels never collide with it.
      setSize(Math.min(width * 0.92, height * 0.72, 720));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
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

/**
 * CheysClock — the full interactive experience, set like a magazine spread:
 * masthead rule across the top, the quiet dial centre-stage over Chey's
 * portrait, and the home copy anchored to the bottom corners (never centred
 * under the dial, so nothing overlaps the numerals).
 *
 * Layers (z): 0 background (page) · 1 face ring · 2 dial marks · 20 hand ·
 * 21 hub · 30 numerals · 40 content panel. The hand rotates (only) to the
 * selected section's angle on a soft spring; selecting XII / closing the
 * panel returns it home to 0°.
 */
export default function CheysClock() {
  const reduce = useReducedMotion();
  const { ref, size: stageSize } = useStageSize();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // null === Home / base immersive state (hand at 0°, no panel).
  const [selectedId, setSelectedId] = useState<SectionId | null>(null);

  const selected = (selectedId ? sectionById(selectedId) : null) ?? null;
  const activeHour = selected ? selected.hourIndex : HOME_SECTION.hourIndex;
  const handAngle = selected ? selected.angle : HOME_SECTION.angle;
  const isOpen = selected !== null;

  const handleSelect = useCallback((hourIndex: number) => {
    const section = sectionByHour(hourIndex);
    if (!section) return;
    // XII (Home) acts as the reset — close any open panel.
    setSelectedId(section.id === "home" ? null : section.id);
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  const homeData =
    HOME_SECTION.data.kind === "home" ? HOME_SECTION.data : null;

  // Shift/scale the clock so it stays visible while the panel is open.
  const stageMotion = !isOpen
    ? { x: 0, y: 0, scale: 1 }
    : isDesktop
      ? { x: -stageSize * 0.2, y: 0, scale: 0.9 }
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

            {/* z-20 — clock hand (rotates only, around the central pivot) */}
            <motion.div
              className="absolute inset-0 z-20 will-change-transform"
              style={{ transformOrigin: HAND_TRANSFORM_ORIGIN }}
              initial={false}
              animate={{ rotate: handAngle }}
              transition={reduce ? { duration: 0 } : HAND_SPRING}
            >
              <ClockHand className="h-full w-full" />
            </motion.div>

            {/* z-[21] — plain centre hub (static, sits over the hand base) */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-[21] -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone-100 bg-void"
              style={{ width: stageSize * 0.028, height: stageSize * 0.028 }}
            />

            {/* z-30 — numerals */}
            <RomanNumerals
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
            <div className="rule mb-4" />
            <div className="flex items-end justify-between gap-8">
              <p className="hidden max-w-sm text-left font-sans text-[13px] leading-relaxed text-bone-200/85 md:block">
                {homeData?.intro}
              </p>
              <div className="flex w-full items-baseline justify-between md:w-auto md:flex-col md:items-end md:gap-1.5">
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

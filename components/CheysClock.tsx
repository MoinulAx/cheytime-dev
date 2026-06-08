"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ClockFace from "./ClockFace";
import ClockHand from "./ClockHand";
import RomanNumerals from "./RomanNumerals";
import ContentPanel from "./ContentPanel";
import { HOME_SECTION, sectionById, sectionByHour } from "@/lib/sections";
import { HAND_SPRING, HAND_TRANSFORM_ORIGIN } from "@/lib/clock";
import type { SectionKind } from "@/types/section";

/** Measure a square clock stage that always fits the viewport. */
function useStageSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Reserve vertical room (≈26%) below the clock for the home text so the
      // numerals/figure never collide with it.
      setSize(Math.min(width * 0.92, height * 0.74, 720));
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
 * CheysClock — the full interactive experience.
 *
 * Layers (z): 0 background (page) · 1 face rings · 2 tick face · 20 hand ·
 * 21 hub · 30 numerals · 40 content panel. The hand rotates (only) to the
 * selected section's angle on a soft overshooting spring; selecting XII /
 * closing the panel returns it home to 0°.
 */
export default function CheysClock() {
  const reduce = useReducedMotion();
  const { ref, size: stageSize } = useStageSize();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // null === Home / base immersive state (hand at 0°, no panel).
  const [selectedId, setSelectedId] = useState<SectionKind | null>(null);

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
      className="relative z-10 flex h-dvh w-full items-center justify-center overflow-hidden pb-24 md:pb-20"
    >
      {/* Brand mark — always visible */}
      <div className="pointer-events-none fixed left-5 top-5 z-40 md:left-8 md:top-7">
        <p className="font-display text-lg font-bold metallic leading-none md:text-xl">
          Chey&apos;s&nbsp;Time
        </p>
        <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.28em] text-diamond-500">
          Hip Hop&apos;s Princess
        </p>
      </div>

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
            {/* z-1 — face ring */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cosmic-400/20"
              style={{
                width: ringDiameter,
                height: ringDiameter,
                boxShadow:
                  "inset 0 0 80px rgba(124,58,237,0.18), 0 0 60px rgba(109,40,217,0.12)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border border-diamond-200/5"
              style={{ width: ringDiameter * 1.06, height: ringDiameter * 1.06 }}
            />

            {/* z-2 — static dial face (tick marks) */}
            <div className="absolute inset-0 z-[2]">
              <ClockFace className="h-full w-full" />
            </div>

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
              stageSize={stageSize}
              activeHour={activeHour}
              onSelect={handleSelect}
            />
          </>
        )}
      </motion.div>

      {/* Home / base overlay — fades out when a section opens */}
      <AnimatePresence>
        {!isOpen && stageSize > 0 && (
          <motion.div
            key="home-overlay"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center bg-gradient-to-t from-void via-void/85 to-transparent px-6 pb-7 pt-28 text-center"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="max-w-sm font-sans text-[13px] leading-relaxed text-diamond-300/75">
              {homeData?.intro}
            </p>
            <p className="eyebrow mt-3 animate-pulse-glow">{homeData?.cue}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* z-40 — content panel */}
      <ContentPanel section={selected} isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}

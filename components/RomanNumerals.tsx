"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ROMAN_NUMERALS, sectionByHour } from "@/lib/sections";
import { getNumeralPositions } from "@/lib/clock";

const POSITIONS = getNumeralPositions(); // constant unit fractions — compute once

interface RomanNumeralsProps {
  /** Pixel edge length of the square clock stage. */
  stageSize: number;
  /** Hour index currently selected (the hand points here). */
  activeHour: number;
  onSelect: (hourIndex: number) => void;
}

/**
 * RomanNumerals — z-30. Twelve numerals laid out on a ring via polar
 * geometry, set in solid bone serif — no gradients, no glows. Every hour now
 * opens a section or a gallery, so all twelve are interactive; each carries a
 * small uppercase label naming its destination (an index, not just a dial).
 * The active hour is inked in violet.
 */
export default function RomanNumerals({
  stageSize,
  activeHour,
  onSelect,
}: RomanNumeralsProps) {
  const reduce = useReducedMotion();
  const fontSize = Math.max(13, stageSize * 0.05);
  // Labels need room below each numeral — hide them on small stages.
  const showLabels = stageSize >= 480;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {POSITIONS.map(({ hourIndex, x, y }) => {
        const numeral = ROMAN_NUMERALS[hourIndex];
        const section = sectionByHour(hourIndex);
        const isInteractive = Boolean(section);
        const isCurrent = activeHour === hourIndex;
        const isGallery = section?.data.kind === "gallery";
        const label =
          section?.id === "home" ? "Reset" : isGallery ? "Gallery" : section?.title;

        const left = x * stageSize;
        const top = y * stageSize;

        return (
          <motion.button
            key={hourIndex}
            type="button"
            disabled={!isInteractive}
            onClick={isInteractive ? () => onSelect(hourIndex) : undefined}
            aria-label={
              section
                ? `${section.title} — ${section.subtitle}`
                : `Numeral ${numeral} (inactive)`
            }
            aria-current={isCurrent ? "true" : undefined}
            tabIndex={isInteractive ? 0 : -1}
            className={[
              "absolute flex select-none touch-manipulation flex-col items-center px-1 leading-none",
              "transition-colors duration-300",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              isInteractive ? "pointer-events-auto cursor-pointer" : "opacity-30",
            ].join(" ")}
            style={{ left, top, x: "-50%", y: "-50%" }}
            initial={false}
            animate={{ scale: isCurrent ? (reduce ? 1 : 1.12) : 1 }}
            whileHover={
              isInteractive && !reduce ? { scale: isCurrent ? 1.14 : 1.08 } : undefined
            }
            whileTap={isInteractive ? { scale: 1.02 } : undefined}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 18 }
            }
          >
            {/* Invisible touch hit-area — keeps tap targets ≥44px on mobile
                without altering the numeral's visual size. Hidden on desktop. */}
            {isInteractive && (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 lg:hidden"
              />
            )}
            <span
              className={[
                "font-display font-bold",
                isCurrent
                  ? "text-cosmic-400"
                  : isGallery
                    ? "text-bone-300"
                    : "text-bone-100",
              ].join(" ")}
              style={{ fontSize }}
            >
              {numeral}
            </span>
            {showLabels && label && (
              <span
                className={[
                  "mt-1.5 font-sans text-[8px] uppercase tracking-[0.22em]",
                  isCurrent ? "text-cosmic-400" : "text-bone-400",
                ].join(" ")}
              >
                {label}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

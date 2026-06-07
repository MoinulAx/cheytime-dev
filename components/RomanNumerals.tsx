"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ROMAN_NUMERALS, sectionByHour } from "@/lib/sections";
import { getNumeralPositions } from "@/lib/clock";

const POSITIONS = getNumeralPositions(); // constant unit fractions — compute once

interface RomanNumeralsProps {
  /** Pixel edge length of the square clock stage. */
  stageSize: number;
  /** Hour index currently selected (the arm points here). */
  activeHour: number;
  onSelect: (hourIndex: number) => void;
}

/**
 * RomanNumerals — z-30. Twelve diamond/silver numerals laid out on a ring via
 * polar geometry. The six mapped to sections are interactive buttons; the rest
 * are visible-but-inactive (disabled) buttons. States: default · hover · active.
 */
export default function RomanNumerals({
  stageSize,
  activeHour,
  onSelect,
}: RomanNumeralsProps) {
  const reduce = useReducedMotion();
  const fontSize = Math.max(13, stageSize * 0.05);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {POSITIONS.map(({ hourIndex, x, y }) => {
        const numeral = ROMAN_NUMERALS[hourIndex];
        const section = sectionByHour(hourIndex);
        const isInteractive = Boolean(section);
        const isCurrent = activeHour === hourIndex;

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
              "absolute font-display font-bold metallic select-none",
              "rounded-full px-1 leading-none",
              "transition-[filter,opacity] duration-300",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              isInteractive
                ? "pointer-events-auto cursor-pointer"
                : "opacity-30",
              isCurrent ? "drop-glow" : "",
            ].join(" ")}
            style={{
              left,
              top,
              fontSize,
              x: "-50%",
              y: "-50%",
              filter: isCurrent
                ? "drop-shadow(0 0 16px rgba(168,85,247,0.85))"
                : isInteractive
                ? "drop-shadow(0 0 5px rgba(168,85,247,0.25))"
                : "none",
            }}
            initial={false}
            animate={{ scale: isCurrent ? (reduce ? 1 : 1.18) : 1 }}
            whileHover={
              isInteractive && !reduce ? { scale: isCurrent ? 1.2 : 1.14 } : undefined
            }
            whileTap={isInteractive ? { scale: 1.04 } : undefined}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 18 }
            }
          >
            {numeral}
          </motion.button>
        );
      })}
    </div>
  );
}

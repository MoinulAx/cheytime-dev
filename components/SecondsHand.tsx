"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  HAND_TRANSFORM_ORIGIN,
  SECONDS_HAND_TIP,
  TICK_SPRING,
  VIEWBOX,
} from "@/lib/clock";

const C = VIEWBOX / 2;

/**
 * SecondsHand — z-19, beneath the selection hand.
 *
 * The dial actually keeps time. It is the cheapest possible way to make the
 * piece feel alive rather than illustrated, and on a site called Chey's Time
 * a clock that doesn't run is a missed joke.
 *
 * Deadbeat seconds (a discrete step per second, not a sweep): each tick is a
 * stiff spring with a faint recoil, so it reads as an escapement releasing.
 *
 * Two details that matter:
 * - It renders nothing until mounted. The server has no business guessing what
 *   second it is, and rendering one would guarantee a hydration mismatch.
 * - The angle accumulates instead of using `seconds * 6`, so crossing 59 → 00
 *   advances by 6° like a real hand rather than spinning 354° backwards.
 */
export default function SecondsHand({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [ticks, setTicks] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const now = new Date();
      // Re-align to the wall clock every tick so we never drift, and so the
      // hand jumps straight back to true after a background-tab throttle.
      timer = setTimeout(() => {
        setTicks((prev) =>
          prev === null ? new Date().getSeconds() : prev + 1,
        );
        schedule();
      }, 1000 - now.getMilliseconds());
    };

    setTicks(new Date().getSeconds());
    schedule();
    return () => clearTimeout(timer);
  }, []);

  if (ticks === null) return null;

  return (
    <motion.svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ transformOrigin: HAND_TRANSFORM_ORIGIN }}
      initial={false}
      animate={{ rotate: ticks * 6 }}
      transition={reduce ? { duration: 0 } : TICK_SPRING}
    >
      {/* counterweight — balances the blade so the pivot reads as the centre */}
      <circle cx={C} cy={556} r={9} fill="rgba(236,232,223,0.3)" />
      <line
        x1={C}
        y1={500}
        x2={C}
        y2={568}
        stroke="rgba(236,232,223,0.3)"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* the blade — thin enough to stay quiet behind the main hand */}
      <line
        x1={C}
        y1={512}
        x2={C}
        y2={SECONDS_HAND_TIP}
        stroke="rgba(236,232,223,0.42)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* lume pip near the tip — the one warm accent on an otherwise cool hand */}
      <circle
        cx={C}
        cy={SECONDS_HAND_TIP + 26}
        r={4.5}
        fill="rgba(167,139,250,0.85)"
      />
    </motion.svg>
  );
}

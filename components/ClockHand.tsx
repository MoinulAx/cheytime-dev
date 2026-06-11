import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

/**
 * ClockHand — a simple, editorial pointer.
 *
 * One slender bone-coloured stem with a short counterweight tail and a small
 * open ring near the tip — the language of a gallery wall clock, nothing
 * faceted or jewelled. Drawn pointing straight up (XII / 0°); rotation is
 * applied by the parent around the shared pivot at the stage centre (500,500).
 */
export default function ClockHand(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* counterweight tail */}
      <line
        x1="500"
        y1="500"
        x2="500"
        y2="572"
        stroke="#ece8df"
        strokeWidth="2.5"
        opacity="0.55"
      />
      <circle
        cx="500"
        cy="586"
        r="13"
        fill="none"
        stroke="#ece8df"
        strokeWidth="2.5"
        opacity="0.55"
      />

      {/* main stem */}
      <line
        x1="500"
        y1="500"
        x2="500"
        y2="172"
        stroke="#ece8df"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* open ring near the tip — frames the numeral it points at */}
      <circle cx="500" cy="206" r="17" fill="none" stroke="#ece8df" strokeWidth="3" />
    </svg>
  );
}

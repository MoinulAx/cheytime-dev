import type { SVGProps } from "react";
import { MINUTE_TRACK_R, VIEWBOX } from "@/lib/clock";

const C = VIEWBOX / 2; // centre

/**
 * ClockFace, the static dial.
 *
 * Twelve hour marks, a full sixty-step minute track, and two hairline chapter
 * rings bounding it. The minute track is what makes this read as a watch dial
 * rather than a circle with ticks: at a glance it's texture, up close it's
 * correct. Quarters are drawn slightly heavier, the way a real chapter ring
 * emphasises 12/3/6/9. The interactive numerals live in {@link RomanNumerals}.
 */
export default function ClockFace(props: SVGProps<SVGSVGElement>) {
  const marks = Array.from({ length: 12 }, (_, i) => (
    <line
      key={i}
      x1={C}
      y1={96}
      x2={C}
      y2={118}
      transform={`rotate(${i * 30} ${C} ${C})`}
      stroke="rgba(236,232,223,0.4)"
      strokeWidth={2}
      strokeLinecap="butt"
    />
  ));

  // Sixty minute ticks. The twelve that coincide with an hour mark are skipped
  // so the longer hour marks stay the dominant reading.
  const minuteTicks = Array.from({ length: 60 }, (_, i) => {
    if (i % 5 === 0) return null;
    const isQuarterNeighbour = i % 5 === 1 || i % 5 === 4;
    return (
      <line
        key={i}
        x1={C}
        y1={96}
        x2={C}
        y2={104}
        transform={`rotate(${i * 6} ${C} ${C})`}
        stroke={`rgba(236,232,223,${isQuarterNeighbour ? 0.2 : 0.14})`}
        strokeWidth={1}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* chapter ring, bounds the minute track top and bottom */}
      <circle
        cx={C}
        cy={C}
        r={MINUTE_TRACK_R}
        fill="none"
        stroke="rgba(236,232,223,0.1)"
        strokeWidth="1"
      />
      <circle
        cx={C}
        cy={C}
        r={MINUTE_TRACK_R - 8}
        fill="none"
        stroke="rgba(236,232,223,0.07)"
        strokeWidth="1"
      />

      {/* hairline guide circle */}
      <circle
        cx={C}
        cy={C}
        r={364}
        fill="none"
        stroke="rgba(236,232,223,0.14)"
        strokeWidth="1"
      />
      {minuteTicks}
      {marks}
    </svg>
  );
}

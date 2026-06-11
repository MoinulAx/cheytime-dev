import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

const C = VIEWBOX / 2; // centre

/**
 * ClockFace — static dial, kept deliberately quiet: twelve short hour marks
 * just inside the numeral ring and a single hairline guide circle. The
 * interactive numerals live in {@link RomanNumerals}.
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

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* hairline guide circle */}
      <circle
        cx={C}
        cy={C}
        r={364}
        fill="none"
        stroke="rgba(236,232,223,0.14)"
        strokeWidth="1"
      />
      {marks}
    </svg>
  );
}

import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

const C = VIEWBOX / 2; // centre

/**
 * ClockFace — static dial: 60 minute ticks (every 5th elongated for the hours)
 * just inside the numeral ring, plus a faint guide circle. Decorative; the
 * interactive numerals live in {@link RomanNumerals}.
 */
export default function ClockFace(props: SVGProps<SVGSVGElement>) {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    return (
      <line
        key={i}
        x1={C}
        y1={major ? 86 : 94}
        x2={C}
        y2={major ? 112 : 102}
        transform={`rotate(${i * 6} ${C} ${C})`}
        stroke={major ? "rgba(229,231,235,0.7)" : "rgba(170,176,188,0.35)"}
        strokeWidth={major ? 3 : 1.5}
        strokeLinecap="round"
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
      {/* faint inner guide circle */}
      <circle
        cx={C}
        cy={C}
        r={364}
        fill="none"
        stroke="rgba(168,85,247,0.12)"
        strokeWidth="1"
      />
      {ticks}
    </svg>
  );
}

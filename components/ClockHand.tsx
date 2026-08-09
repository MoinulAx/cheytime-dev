import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

/** Which of the two hands to draw. */
export type HandVariant = "minute" | "hour";

const C = VIEWBOX / 2;
/** Where every blade meets the hub. */
const BASE = 502;

/**
 * The two hands, as tip distance from the pivot and half-width at the waist.
 *
 * A real dial reads at a glance because the hands differ in *length* far more
 * than in decoration — so the hour hand is the same blade, cut to roughly
 * two-thirds and broadened a touch to keep its visual weight.
 */
const GEOMETRY: Record<HandVariant, { tip: number; halfWidth: number; tail: number }> = {
  minute: { tip: 150, halfWidth: 11, tail: 604 },
  hour: { tip: 283, halfWidth: 15, tail: 578 },
};

/**
 * ClockHand — a faceted dauphine-style hand in diamond/silver, drawn pointing
 * straight up (the XII / 0° rest state). Rotation is applied by the parent
 * around the shared pivot at the stage centre (500,500). The jewelled centre
 * hub is rendered separately (static) so it never rotates.
 *
 * Two instances are mounted: the hour hand parked at XII, and the minute hand
 * that sweeps to the open section. Gradient ids are suffixed per variant —
 * both hands are in the DOM at once, and duplicate ids would make the second
 * one silently borrow the first one's fills.
 */
export default function ClockHand({
  variant = "minute",
  ...props
}: SVGProps<SVGSVGElement> & { variant?: HandVariant }) {
  const { tip, halfWidth, tail } = GEOMETRY[variant];

  // Widest point of the blade, 8% up from the base — the proportion the
  // original hand was drawn at, held constant so both hands share a silhouette.
  const waist = BASE - (BASE - tip) * 0.08;
  const length = BASE - tip;

  // Diamond accent, positioned as a fraction of blade length so it lands in
  // the same place on the shorter hand.
  const accent = {
    top: tip + length * 0.131,
    mid: tip + length * 0.267,
    bottom: tip + length * 0.403,
    half: halfWidth * 1.09,
  };

  const blade = `M${C} ${tip} L${C + halfWidth} ${waist} L${C} ${BASE} L${C - halfWidth} ${waist} Z`;
  const id = (name: string) => `${name}-${variant}`;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id={id("handLight")} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#aab0bc" />
        </linearGradient>
        <linearGradient id={id("handDark")} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#cdd2da" />
          <stop offset="0.5" stopColor="#868e9c" />
          <stop offset="1" stopColor="#5b626e" />
        </linearGradient>

        {/*
          Gleam — a narrow band of light that travels down the blade every few
          seconds, the way a polished index catches a moving light source. It is
          a moving gradient stop rather than an overlay, so it reads as the
          metal brightening, not as a shape laid on top.

          Minute hand only. On both it reads as a blinking dial rather than a
          catch of light.
        */}
        {variant === "minute" && (
          <linearGradient id={id("handGleam")} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.42" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.58" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="0 -1; 0 1; 0 1"
              dur="5.5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.45; 1"
              keySplines="0.4 0 0.2 1; 0 0 1 1"
            />
          </linearGradient>
        )}
      </defs>

      {/* counterweight tail */}
      <path
        d={`M${C} 500 L${C + 7} ${tail - 16} L${C} ${tail} L${C - 7} ${tail - 16} Z`}
        fill={`url(#${id("handDark")})`}
        opacity="0.85"
      />

      {/* faceted blade — two halves catch light differently */}
      <path
        d={`M${C} ${tip} L${C} ${BASE} L${C - halfWidth} ${waist} Z`}
        fill={`url(#${id("handDark")})`}
      />
      <path
        d={`M${C} ${tip} L${C + halfWidth} ${waist} L${C} ${BASE} Z`}
        fill={`url(#${id("handLight")})`}
      />

      {/* diamond accent near the tip */}
      <path
        d={`M${C} ${accent.top} L${C + accent.half} ${accent.mid} L${C} ${accent.bottom} L${C - accent.half} ${accent.mid} Z`}
        fill={`url(#${id("handLight")})`}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
      />

      {/* travelling gleam, clipped to the blade silhouette */}
      {variant === "minute" && (
        <path
          d={blade}
          fill={`url(#${id("handGleam")})`}
          className="motion-reduce:hidden"
        />
      )}

      {/* crisp outer edge */}
      <path
        d={blade}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

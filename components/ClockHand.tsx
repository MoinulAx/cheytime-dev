import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

/**
 * ClockHand — the single luxe pointer (the clock's "hand").
 *
 * A faceted dauphine-style hand in diamond/silver, drawn pointing straight up
 * (the XII / 0° rest state). Rotation is applied by the parent around the
 * shared pivot at the stage centre (500,500). The jewelled centre hub is
 * rendered separately (static) so it never rotates.
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
      <defs>
        <linearGradient id="handLight" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#aab0bc" />
        </linearGradient>
        <linearGradient id="handDark" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#cdd2da" />
          <stop offset="0.5" stopColor="#868e9c" />
          <stop offset="1" stopColor="#5b626e" />
        </linearGradient>

        {/*
          Gleam — a narrow band of light that travels down the blade every few
          seconds, the way a polished index catches a moving light source. It is
          a moving gradient stop rather than an overlay, so it reads as the
          metal brightening, not as a shape laid on top.
        */}
        <linearGradient id="handGleam" x1="0.5" y1="0" x2="0.5" y2="1">
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
      </defs>

      {/* counterweight tail */}
      <path
        d="M500 500 L507 588 L500 604 L493 588 Z"
        fill="url(#handDark)"
        opacity="0.85"
      />

      {/* faceted blade — two halves catch light differently */}
      <path d="M500 150 L500 502 L489 474 Z" fill="url(#handDark)" />
      <path d="M500 150 L511 474 L500 502 Z" fill="url(#handLight)" />

      {/* diamond accent near the tip */}
      <path
        d="M500 196 L512 244 L500 292 L488 244 Z"
        fill="url(#handLight)"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
      />

      {/* travelling gleam, clipped to the blade silhouette */}
      <path
        d="M500 150 L511 474 L500 502 L489 474 Z"
        fill="url(#handGleam)"
        className="motion-reduce:hidden"
      />

      {/* crisp outer edge */}
      <path
        d="M500 150 L511 474 L500 502 L489 474 Z"
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

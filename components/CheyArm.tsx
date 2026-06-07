import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

/**
 * CheyArm — the raised arm ONLY, the clock's single hand.
 *
 * A graceful raised arm — shoulder → bicep → forearm → a soft reaching hand —
 * drawn pointing straight up (the XII / 0° rest state). Rotation is applied by
 * the parent around the shared shoulder pivot at the stage centre (500,500).
 * The shoulder cap dips slightly below the pivot so it overlaps the body's bare
 * shoulder. Shares the 1000×1000 design space + styling with {@link CheyBody}.
 */
export default function CheyArm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id="cheyArmFill" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0" stopColor="#3a2470" />
          <stop offset="0.55" stopColor="#20133f" />
          <stop offset="1" stopColor="#412884" />
        </linearGradient>
        <linearGradient id="cheyArmRim" x1="0.1" y1="0.9" x2="0.9" y2="0.1">
          <stop offset="0" stopColor="rgba(231,222,255,0.6)" />
          <stop offset="0.5" stopColor="rgba(168,85,247,0.45)" />
          <stop offset="1" stopColor="rgba(245,238,254,0.9)" />
        </linearGradient>
      </defs>

      <path
        d="M458 516
           C456 452 460 392 468 336
           C472 300 478 268 486 240
           C480 216 482 192 492 174
           C496 162 502 156 510 156
           C522 156 530 168 530 184
           C530 198 526 210 520 222
           C524 262 528 300 532 336
           C540 392 542 452 540 516
           C532 534 466 534 458 516 Z"
        fill="url(#cheyArmFill)"
        stroke="url(#cheyArmRim)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

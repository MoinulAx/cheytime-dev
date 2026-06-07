import type { SVGProps } from "react";
import { VIEWBOX } from "@/lib/clock";

/**
 * CheyBody — the figure silhouette, BODY ONLY (no raised arm).
 *
 * An elegant bust-up feminine figure that dissolves into the void at the
 * bottom: sleek hair, slender neck, soft shoulders and an hourglass torso.
 * The left shoulder is left bare at the stage centre (500,500) where the
 * separate {@link CheyArm} connects. Shares the 1000×1000 design space + styling.
 */
export default function CheyBody(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id="cheyBodyFill" x1="0.5" y1="0.1" x2="0.5" y2="1">
          <stop offset="0" stopColor="#3a2470" />
          <stop offset="0.45" stopColor="#1d1140" />
          <stop offset="0.85" stopColor="#0c0620" />
          <stop offset="1" stopColor="#0c0620" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cheyBodyRim" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <stop offset="0" stopColor="rgba(231,222,255,0.85)" />
          <stop offset="0.5" stopColor="rgba(168,85,247,0.4)" />
          <stop offset="1" stopColor="rgba(124,58,237,0)" />
        </linearGradient>
      </defs>

      {/* Hair — behind, framing the face and falling to the shoulders */}
      <path
        d="M468 338
           C458 280 486 240 532 238
           C580 236 614 276 612 338
           C611 394 602 442 586 486
           L556 482
           C566 442 570 398 566 358
           C560 314 540 294 512 294
           C484 294 464 314 458 358
           C454 398 458 442 468 484
           L444 488
           C456 436 464 388 468 338 Z"
        fill="url(#cheyBodyFill)"
        opacity="0.96"
      />

      {/* Head / face — on top, meeting the neckline */}
      <path
        d="M474 352
           C472 316 490 294 514 294
           C540 294 558 318 558 356
           C558 390 545 418 524 432
           C516 438 506 438 498 432
           C484 420 476 388 474 352 Z"
        fill="url(#cheyBodyFill)"
        stroke="url(#cheyBodyRim)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Torso: neck → shoulders → hourglass, fading into the void */}
      <path
        d="M452 520
           C460 484 478 470 500 466
           C500 452 500 446 500 438
           L524 438
           C524 446 524 452 524 466
           C548 470 566 486 576 522
           C586 560 580 600 552 642
           C538 686 560 726 590 800
           C600 836 606 868 608 900
           L416 900
           C418 868 424 836 434 800
           C464 726 486 686 472 642
           C444 600 438 560 448 522
           C449 521 450 520 452 520 Z"
        fill="url(#cheyBodyFill)"
        stroke="url(#cheyBodyRim)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* faint collarbone / neckline */}
      <path
        d="M504 478 C512 488 524 488 536 480"
        fill="none"
        stroke="rgba(168,85,247,0.18)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

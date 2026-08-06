/**
 * Clock geometry constants.
 *
 * The clock hand (ClockHand), the tick face (ClockFace) and the numeral ring
 * all live in a shared 1000×1000 design space rendered into a single centred
 * square "stage". The hand pivot sits at the exact centre of that space, which
 * is also the centre of the numeral ring, so the hand points cleanly at
 * whichever numeral is selected.
 */

/** The shared SVG viewBox edge length for the hand + face. */
export const VIEWBOX = 1000;

/** The hand pivot in viewBox units — the centre of the stage. */
export const PIVOT = { x: VIEWBOX / 2, y: VIEWBOX / 2 } as const;

/**
 * CSS transform-origin for the clock hand, as percentages of the stage.
 * ── TUNING ──────────────────────────────────────────────────────────────
 * The single knob for the hand's rotation pivot. Maps to PIVOT above
 * (50% 50% == centre of the 1000×1000 space).
 */
export const HAND_TRANSFORM_ORIGIN = `${(PIVOT.x / VIEWBOX) * 100}% ${
  (PIVOT.y / VIEWBOX) * 100
}%`;

export interface NumeralPosition {
  hourIndex: number;
  /** x within a unit box [0..1] for responsive placement. */
  x: number;
  /** y within a unit box [0..1]. */
  y: number;
  angle: number;
}

/**
 * Generate the twelve numeral positions on a ring using polar coordinates.
 * Returned as unit fractions [0..1] of the stage so the caller can multiply by
 * the measured pixel size — geometry stays perfect at any screen size.
 *
 * @param radius ring radius as a fraction of half the stage (0..1). 0.86 keeps
 *               numerals just inside the stage edge.
 */
export function getNumeralPositions(radius = 0.86): NumeralPosition[] {
  return Array.from({ length: 12 }, (_, hourIndex) => {
    const angleDeg = hourIndex * 30 - 90; // -90 so hour 0 (XII) sits at top
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      hourIndex,
      x: 0.5 + (radius / 2) * Math.cos(angleRad),
      y: 0.5 + (radius / 2) * Math.sin(angleRad),
      angle: hourIndex * 30,
    };
  });
}

/**
 * Spring used for the hand sweep.
 *
 * ── TUNING ──────────────────────────────────────────────────────────────
 * Tuned to read as an escapement releasing rather than a UI easing curve: it
 * leaves quickly, overshoots the target by a hair and settles in one visible
 * recoil. Softening `stiffness` or raising `damping` drifts it back toward
 * generic-web-animation feel, which is exactly what we're avoiding.
 */
export const HAND_SPRING = {
  type: "spring" as const,
  stiffness: 92,
  damping: 11,
  mass: 0.85,
};

/**
 * Spring for a single deadbeat-seconds step. Stiff and light so each 6° tick
 * lands crisply with a faint recoil — the mechanical "tick" you feel more than
 * you see. Must settle well inside one second or ticks pile up.
 */
export const TICK_SPRING = {
  type: "spring" as const,
  stiffness: 780,
  damping: 21,
  mass: 0.45,
};

/** Radius (viewBox units) of the outer minute track. */
export const MINUTE_TRACK_R = 404;

/** How far the seconds hand reaches — just past the minute track. */
export const SECONDS_HAND_TIP = 108;

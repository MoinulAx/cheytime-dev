/**
 * Clock geometry + silhouette alignment constants.
 *
 * The silhouette (CheyBody + CheyArm) and the numeral ring all live in a shared
 * 1000×1000 design space rendered into a single centered square "stage". The
 * arm pivot — the figure's raised shoulder — sits at the exact centre of that
 * space, which is also the centre of the numeral ring, so the arm reads as a
 * true clock hand pointing at whichever numeral is selected.
 */

/** The shared SVG viewBox edge length for body + arm. */
export const VIEWBOX = 1000;

/** The pivot (raised shoulder) in viewBox units — the centre of the stage. */
export const PIVOT = { x: VIEWBOX / 2, y: VIEWBOX / 2 } as const;

/**
 * CSS transform-origin for the arm, expressed as percentages of the stage.
 * ── TUNING ──────────────────────────────────────────────────────────────
 * This is the single knob for the arm's rotation pivot. It maps to PIVOT
 * above (50% 50% == centre of the 1000×1000 space). Adjust both together if
 * you ever move the shoulder.
 */
export const ARM_TRANSFORM_ORIGIN = `${(PIVOT.x / VIEWBOX) * 100}% ${
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

/** Spring used for the arm sweep — overshoots slightly, settles naturally. */
export const ARM_SPRING = {
  type: "spring" as const,
  stiffness: 45,
  damping: 14,
  mass: 1.1,
};

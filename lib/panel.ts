/**
 * Desktop content-panel width.
 *
 * Shared between the panel itself and the clock, because the two are coupled:
 * the panel takes the right-hand strip, and the clock has to re-centre into
 * whatever is left. Hard-coding the width in one place and a shift fraction in
 * the other is how they drift into overlapping.
 */

/** Panel width in px for a given viewport width (desktop only, >= 1024). */
export function panelWidthFor(viewportWidth: number): number {
  if (viewportWidth >= 1536) return 780;
  if (viewportWidth >= 1280) return 680;
  return 560;
}

/** Tailwind classes matching {@link panelWidthFor}. Keep the two in step. */
export const PANEL_WIDTH_CLASSES =
  "max-w-[560px] xl:max-w-[680px] 2xl:max-w-[780px]";

/** Fraction of the free strip the clock is allowed to occupy when open. */
const CLOCK_FIT = 0.9;

/**
 * How the clock stage should move when the panel opens on desktop.
 *
 * Shifting by `-panelWidth / 2` re-centres the stage in the strip left of the
 * panel — the free space is `vw - panelWidth`, whose centre sits exactly that
 * far left of the viewport centre. Scale only shrinks when the dial would
 * otherwise be wider than the strip, so on roomy screens it stays large.
 */
export function clockStageMotion(
  viewportWidth: number,
  stageSize: number,
): { x: number; y: number; scale: number } {
  const panel = panelWidthFor(viewportWidth);
  const free = Math.max(viewportWidth - panel, 0);
  const scale =
    stageSize > 0 ? Math.min(0.9, (free * CLOCK_FIT) / stageSize) : 0.9;
  return { x: -panel / 2, y: 0, scale: Math.max(scale, 0.42) };
}

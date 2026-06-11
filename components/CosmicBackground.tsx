import Image from "next/image";

/**
 * CosmicBackground — z-0 layer.
 *
 * Chey herself is the backdrop: the full-length portrait, desaturated to an
 * editorial near-monochrome and anchored to the right of the frame, under a
 * left-weighted dark gradient that keeps the dial and type legible. A film
 * grain pass sits on top. One faint, static violet wash keeps the brand's
 * cosmic note without any animated smoke. Purely decorative.
 */
export default function CosmicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void"
    >
      {/* The portrait (solid black shows through until it loads). */}
      <Image
        src="/assets/chey-figure.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="photo-treatment object-cover object-[70%_15%] opacity-45 md:object-[78%_20%]"
      />

      {/* Legibility gradients — heavier on the left where the type lives,
          and along the bottom where the home copy sits. */}
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/75 to-void/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/60" />

      {/* Single static violet wash — the cosmic accent, no animation. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 70% 35%, rgba(109,40,217,0.12), transparent 70%)",
        }}
      />

      {/* Film grain. */}
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </div>
  );
}

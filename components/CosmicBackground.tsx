import Image from "next/image";

/**
 * CosmicBackground — z-0 layer.
 *
 * A next/image base (fill · priority · object-cover) over a solid-black
 * fallback, with two slow CSS smoke drifts and a faint star shimmer layered on
 * top for living, cinematic atmosphere. Purely decorative.
 */
export default function CosmicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void"
    >
      {/* Base cosmic image (solid black shows through until/if it loads). */}
      <Image
        src="/assets/cosmic-bg.svg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Drifting purple smoke — animated, GPU-friendly (transform/opacity). */}
      <div
        className="absolute inset-0 animate-smoke-drift will-change-transform"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 35%, rgba(124,58,237,0.28), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 animate-smoke-drift-slow will-change-transform"
        style={{
          background:
            "radial-gradient(55% 45% at 72% 70%, rgba(168,85,247,0.22), transparent 72%)",
        }}
      />

      {/* Centre halo behind the figure. */}
      <div
        className="absolute inset-0 animate-pulse-glow"
        style={{
          background:
            "radial-gradient(40% 40% at 50% 50%, rgba(109,40,217,0.22), transparent 70%)",
        }}
      />
    </div>
  );
}

import Image from "next/image";
import Sparkles from "./Sparkles";

/**
 * CosmicBackground, z-0 layer.
 *
 * Chey herself is the backdrop: a high-res still from the Long Kiss Goodnight
 * video (the second frame in the IX · The Reel gallery), anchored to the right
 * and given a very slow Ken-Burns drift so the page breathes. A left- and
 * bottom-weighted void gradient keeps the dial and editorial type legible,
 * offset smoke drifts add depth, and a layer of glowing hearts + twinkling
 * sparkles plays over the portrait. No blur, no glassmorphism, a darkened
 * photograph in motion. Purely decorative.
 */
export default function CosmicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void"
    >
      {/* Chey, the hearts-and-triangles frame, cropped to drop the Gemini
          watermark (bottom-right) and the excess purple padding (left). The
          glowing hearts and sparkles are baked into this image. */}
      <div className="absolute inset-0 animate-slow-zoom will-change-transform motion-reduce:animate-none">
        <Image
          src="/assets/chey-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_32%] opacity-[0.62]"
        />
      </div>

      {/* Legibility gradients, heavier on the left where the type lives and
          along the bottom where the home copy sits. */}
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/55" />

      {/* Two offset smoke drifts give the dark field depth and slow parallax,
          a violet wash riding over a deeper indigo, both low and unhurried. */}
      <div
        className="absolute inset-0 animate-smoke-drift will-change-transform motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(50% 42% at 30% 28%, rgba(59,13,128,0.28), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 animate-smoke-drift-slow will-change-transform motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(55% 45% at 70% 38%, rgba(124,58,237,0.18), transparent 72%)",
        }}
      />

      {/* Vignette, pulls the corners down so the dial reads as the lit centre. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 48%, transparent 38%, rgba(5,2,8,0.55) 78%, rgba(5,2,8,0.9) 100%)",
        }}
      />

      {/* Glowing hearts + sparkles over the portrait. */}
      <Sparkles />

      {/* Film grain, fine texture so the gradients never read as flat banding. */}
      <div className="grain absolute inset-0 opacity-[0.06] mix-blend-overlay" />
    </div>
  );
}

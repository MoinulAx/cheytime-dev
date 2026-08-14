/**
 * Sparkles, twinkling stars layered over the background portrait to give the
 * otherwise-static image a bit of living shimmer (the glowing hearts are
 * already baked into the photo, so none are drawn here). Positions, sizes and
 * animation delays are hardcoded (no Math.random) so the server and client
 * render identically, no hydration mismatch, no client JS. All motion is
 * paused under prefers-reduced-motion.
 */

const SPARKLE_PATH =
  "M12 0c.9 6.5 4.5 10.1 11 11-6.5.9-10.1 4.5-11 11-.9-6.5-4.5-10.1-11-11C7.5 10.1 11.1 6.5 12 0z";

// Sparkles scattered across the whole field.
const SPARKLES = [
  { left: "18%", top: "26%", size: 12, delay: "0s", dur: "3.2s" },
  { left: "30%", top: "62%", size: 8, delay: "1.1s", dur: "3.8s" },
  { left: "46%", top: "20%", size: 10, delay: "2.2s", dur: "3.4s" },
  { left: "54%", top: "78%", size: 7, delay: "0.6s", dur: "4.2s" },
  { left: "68%", top: "18%", size: 11, delay: "1.6s", dur: "3.6s" },
  { left: "82%", top: "24%", size: 8, delay: "2.8s", dur: "4s" },
  { left: "88%", top: "66%", size: 10, delay: "0.3s", dur: "3.3s" },
  { left: "76%", top: "84%", size: 9, delay: "3.1s", dur: "3.9s" },
  { left: "24%", top: "82%", size: 7, delay: "2.0s", dur: "4.4s" },
  { left: "62%", top: "50%", size: 9, delay: "1.4s", dur: "3.5s" },
];

export default function Sparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SPARKLES.map((s, i) => (
        <svg
          key={`s-${i}`}
          viewBox="0 0 24 24"
          className="absolute animate-twinkle motion-reduce:animate-none"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.dur,
            fill: "rgba(237,231,255,0.95)",
            filter: "drop-shadow(0 0 5px rgba(216,180,254,0.9))",
          }}
        >
          <path d={SPARKLE_PATH} />
        </svg>
      ))}
    </div>
  );
}

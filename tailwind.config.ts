import type { Config } from "tailwindcss";

/**
 * Chey Time, editorial dark theme.
 * Palette: deep void black, bone/ivory type, cosmic violet used sparingly as
 * an ink accent (never as a glow).
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#050208",
          900: "#070310",
          800: "#0c0718",
          700: "#140b26",
        },
        cosmic: {
          50: "#f3eefe",
          200: "#d6c6fb",
          400: "#a855f7",
          500: "#8b3df0",
          600: "#7c3aed",
          700: "#6d28d9",
          900: "#3b0d80",
        },
        // Warm print-paper ivory, the editorial type colour.
        bone: {
          50: "#f6f3ec",
          100: "#ece8df",
          200: "#ddd8cc",
          300: "#c5bfb1",
          400: "#a39d8f",
          500: "#85806f",
          600: "#5e5a4d",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Playfair Display", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.35em",
        wide2: "0.2em",
      },
      keyframes: {
        "smoke-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.55" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.08)", opacity: "0.8" },
        },
        "smoke-drift-slow": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1.05)", opacity: "0.4" },
          "50%": { transform: "translate3d(-3%, 2%, 0) scale(1)", opacity: "0.65" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        // Very slow Ken-Burns drift for the background portrait.
        "slow-zoom": {
          "0%, 100%": { transform: "scale(1.04) translate3d(0, 0, 0)" },
          "50%": { transform: "scale(1.12) translate3d(-1.5%, -1%, 0)" },
        },
        // Sparkle: a star fades up, peaks, and fades out.
        twinkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0.4) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1) rotate(45deg)" },
        },
        // Heart: gentle float upward while its glow breathes.
        "heart-float": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.85)" },
          "30%, 70%": { opacity: "0.85" },
          "100%": { opacity: "0", transform: "translateY(-18px) scale(1.05)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "smoke-drift": "smoke-drift 22s ease-in-out infinite",
        "smoke-drift-slow": "smoke-drift-slow 30s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "slow-zoom": "slow-zoom 32s ease-in-out infinite",
        twinkle: "twinkle 3.6s ease-in-out infinite",
        "heart-float": "heart-float 7s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;

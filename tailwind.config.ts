import type { Config } from "tailwindcss";

/**
 * Chey Time — editorial dark theme.
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
        // Warm print-paper ivory — the editorial type colour.
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
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;

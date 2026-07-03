import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    "#06080f",
          surface: "#0b0f1a",
          card:    "#0f1520",
          hover:   "#131c2e",
          input:   "#111827",
        },
        line:  { DEFAULT: "#1a2436", strong: "#243044" },
        ink:   { DEFAULT: "#e2eaf4", muted: "#4a6080", soft: "#8a9ab8" },
        teal:  { DEFAULT: "#00d4a0", dark: "#001f17", mid: "#003d2e", glow: "#00d4a030" },
        violet:{ DEFAULT: "#8b7ff5", dark: "#130f2e", glow: "#8b7ff530" },
        amber: { DEFAULT: "#f0a030", dark: "#1e1200", glow: "#f0a03030" },
        rose:  { DEFAULT: "#e05a3a", dark: "#280e06", glow: "#e05a3a30" },
        sky:   { DEFAULT: "#4090e0", dark: "#041525", glow: "#4090e030" },
        sage:  { DEFAULT: "#50d4a0", dark: "#001f17" },
        // ── backward compat aliases ──────────────────────
        purple: { DEFAULT: "#8b7ff5", dark: "#130f2e" },
        muted:  { DEFAULT: "#4a6080", light: "#8a9ab8" },
        border: { DEFAULT: "#1a2436", strong: "#243044" },
      },
      fontFamily: {
        sans: ["Inter var","Inter","system-ui","sans-serif"],
        mono: ["JetBrains Mono","monospace"],
      },
      keyframes: {
        "fade-up":   { from:{ opacity:"0", transform:"translateY(12px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        "fade-in":   { from:{ opacity:"0" },                               to:{ opacity:"1" } },
        "scale-in":  { from:{ opacity:"0", transform:"scale(.95)" },       to:{ opacity:"1", transform:"scale(1)" } },
        "slide-in-left":{ from:{ opacity:"0",transform:"translateX(-20px)" }, to:{ opacity:"1",transform:"translateX(0)" } },
        "slide-in-right":{ from:{opacity:"0",transform:"translateX(20px)"},   to:{opacity:"1",transform:"translateX(0)"} },
        "glow-pulse":{ "0%,100%":{ opacity:"0.6" }, "50%":{ opacity:"1" } },
        "spin-slow": { to:{ transform:"rotate(360deg)" } },
        "bounce-dot":{ "0%,80%,100%":{ transform:"scale(.55)",opacity:".4" }, "40%":{ transform:"scale(1)",opacity:"1" } },
        "float":     { "0%,100%":{ transform:"translateY(0px)" }, "50%":{ transform:"translateY(-6px)" } },
        "draw":      { from:{ strokeDashoffset:"1000" }, to:{ strokeDashoffset:"0" } },
        "count-up":  { from:{ opacity:"0",transform:"translateY(4px)" }, to:{ opacity:"1",transform:"translateY(0)" } },
        "shimmer":   { from:{ backgroundPosition:"-400px 0" }, to:{ backgroundPosition:"400px 0" } },
        "ring-fill": { from:{ strokeDasharray:"0 283" } },
      },
      animation: {
        "fade-up":        "fade-up .5s ease both",
        "fade-up-1":      "fade-up .5s .1s ease both",
        "fade-up-2":      "fade-up .5s .2s ease both",
        "fade-up-3":      "fade-up .5s .3s ease both",
        "fade-up-4":      "fade-up .5s .4s ease both",
        "fade-in":        "fade-in .3s ease both",
        "scale-in":       "scale-in .3s ease both",
        "slide-left":     "slide-in-left .4s ease both",
        "slide-right":    "slide-in-right .4s ease both",
        "glow":           "glow-pulse 2.5s ease-in-out infinite",
        "spin-slow":      "spin-slow 1s linear infinite",
        "dot-1":          "bounce-dot 1.2s .0s ease-in-out infinite",
        "dot-2":          "bounce-dot 1.2s .2s ease-in-out infinite",
        "dot-3":          "bounce-dot 1.2s .4s ease-in-out infinite",
        "float":          "float 3s ease-in-out infinite",
        "shimmer":        "shimmer 2s linear infinite",
        "ring":           "ring-fill .8s .2s ease-out both",
      },
      boxShadow: {
        teal:   "0 0 24px rgba(0,212,160,.2)",
        violet: "0 0 24px rgba(139,127,245,.2)",
        card:   "0 4px 32px rgba(0,0,0,.5)",
        glow:   "0 0 40px rgba(0,212,160,.08)",
      },
    },
  },
  plugins: [],
};
export default config;

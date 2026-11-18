import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("--bg"),
        surface: c("--surface"),
        border: c("--border"),
        ink: c("--text"),
        muted: c("--muted"),
        accent: c("--accent"),
        "accent-text": c("--accent-text"),
        danger: c("--danger"),
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        etcha: {
          bg: '#0a0c10',
          surface: '#12151c',
          'surface-hover': '#181c26',
          border: '#1e2330',
          'border-accent': '#2a3040',
          'text-primary': '#e8eaf0',
          'text-secondary': '#8891a5',
          'text-dim': '#505870',
          copper: '#c87941',
          'copper-light': '#e09a5f',
          'copper-glow': 'rgba(200, 121, 65, 0.15)',
          green: '#34d399',
          red: '#f87171',
          blue: '#60a5fa',
          purple: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "var(--font-geist-sans)", "-apple-system", "sans-serif"],
        mono: ["'DM Mono'", "var(--font-geist-mono)", "monospace"],
        serif: ["'Instrument Serif'", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;

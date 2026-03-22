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
        trading: {
          bg: '#0a0e17',
          surface: '#131a2a',
          border: '#1e293b',
          'text-primary': '#e2e8f0',
          'text-secondary': '#94a3b8',
          accent: '#3b82f6',
          'call-green': '#22c55e',
          'put-red': '#ef4444',
          warning: '#f59e0b',
          gold: '#eab308',
        },
      },
    },
  },
  plugins: [],
};
export default config;

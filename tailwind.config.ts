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
        // GenKaカラーパレット
        'bg-primary': '#0F1117',
        'bg-secondary': '#1A1D26',
        'bg-tertiary': '#222639',
        'border-custom': '#2E3347',
        'text-primary': '#F0F2F8',
        'text-secondary': '#8B92A9',
        'accent-primary': '#F59E0B',
        'accent-secondary': '#3B82F6',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      minHeight: {
        '12': '48px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;

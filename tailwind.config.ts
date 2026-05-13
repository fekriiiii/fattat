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
        primary: {
          DEFAULT: '#0F766E',
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          900: '#134E4A',
        },
        dark:  '#1F2937',
        cream: '#FBFAF7',
        gold:  '#D4A017',
      },
      fontFamily: {
        sans: ['Aeonik', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        btn: '14px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
};
export default config;

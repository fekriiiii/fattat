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
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
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
        card: '1.25rem',
        btn: '14px',
        pill: '9999px',
      },
      boxShadow: {
        // 3-level warm elevation scale (charcoal-tinted, never pure black)
        card: '0 1px 2px rgba(31,41,55,0.04), 0 4px 16px -2px rgba(31,41,55,0.06)',
        'card-hover': '0 2px 4px rgba(31,41,55,0.05), 0 12px 28px -6px rgba(31,41,55,0.12)',
        raised: '0 2px 6px rgba(31,41,55,0.05), 0 16px 36px -8px rgba(31,41,55,0.10)',
        // Brand glows for hero surfaces and primary actions
        hero: '0 12px 32px -8px rgba(15,118,110,0.40), 0 2px 8px rgba(15,118,110,0.12)',
        btn: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(15,118,110,0.20), 0 8px 20px -6px rgba(15,118,110,0.40)',
        'btn-pressed': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(15,118,110,0.15), 0 3px 10px -4px rgba(15,118,110,0.30)',
        'glow-gold': '0 6px 20px -4px rgba(212,160,23,0.35)',
        nav: '0 -8px 28px rgba(31,41,55,0.07)',
      },
      keyframes: {
        'pop-in': {
          '0%':   { transform: 'scale(0.4)', opacity: '0' },
          '70%':  { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateY(6px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        'bar-grow': {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to:   { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        // 'both' fill mode so staggered elements stay hidden until their delay.
        'pop-in': 'pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'slide-in': 'slide-in 0.22s cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'bar-grow': 'bar-grow 0.8s cubic-bezier(0.05, 0.7, 0.1, 1) both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;

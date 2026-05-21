import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chrome: {
          50:  '#f9f9f9',
          100: '#ececec',
          200: '#d8d8d8',
          300: '#c0c0c0',
          400: '#a8a8a8',
          500: '#8e8e8e',
          600: '#707070',
          700: '#545454',
          800: '#3a3a3a',
          900: '#1f1f1f',
        },
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        barlow: ['Barlow Condensed', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(192,192,192,0.3), 0 0 30px rgba(192,192,192,0.1)' },
          '50%': { boxShadow: '0 0 24px rgba(192,192,192,0.6), 0 0 60px rgba(192,192,192,0.25)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

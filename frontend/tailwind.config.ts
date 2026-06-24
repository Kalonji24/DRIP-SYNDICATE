import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:    '#0B0B0F',   // near-black base
        carbon: '#16181D',   // panel surface
        blood:  '#C81D25',   // DRIP signature red
        bone:   '#F4F1EA',   // off-white
        ash:    '#9AA0A6'    // muted text
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } }
      },
      animation: { marquee: 'marquee 22s linear infinite' }
    }
  },
  plugins: []
};
export default config;

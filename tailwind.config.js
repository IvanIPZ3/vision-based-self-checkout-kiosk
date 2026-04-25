/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kiosk: {
          bg: '#07101c',
          panel: '#0d1a2b',
          panelAlt: '#11233a',
          accent: '#2de2c7',
          action: '#00a3ff',
          danger: '#ff5d5d',
          warning: '#f9bb54',
          success: '#2ad26f',
        },
      },
      fontFamily: {
        display: ['"Exo 2"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 20px 60px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}

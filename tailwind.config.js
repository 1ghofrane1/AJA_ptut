/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        aja: {
          cream: '#fef6e2',
          ink: '#14272d',
          sage: '#7ea69d',
          mint: '#b3d3d2',
          sand: '#dfc485',
          soft: '#e7ede7',
        },
      },
      borderRadius: {
        xl2: '20px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(20,39,45,0.08)',
      },
    },
  },
  plugins: [],
};
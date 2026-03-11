/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d63031',
        secondary: '#2d3436',
        surface: '#ffffff',
        'text-muted': '#636e72',
        border: '#eaeced',
        background: '#fdfdfd',
      },
      borderRadius: {
        xl: '12px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


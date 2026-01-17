/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // HomeNest brand (dark elegant)
        navy: {
          900: '#0A1628',
          800: '#132238',
          700: '#1a2f4a',
        },
        gold: {
          500: '#C9A962',
          400: '#d4b978',
          600: '#b8944d',
        },
        // Norvan axis colors
        norx: '#007FFF',  // Insight - Blue
        nory: '#7F4FC9',  // Architecture - Purple
        norz: '#F28500',  // Expression - Orange
        norw: '#009E60',  // Knowledge - Green
        norv: '#00A6FB',  // Execution - Cyan
        // Accent
        accent: '#00D9FF', // Cyan accent
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

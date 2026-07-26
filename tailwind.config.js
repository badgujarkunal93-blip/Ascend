/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        judge: {
          base: '#0B0E11',
          surface: '#12161B',
          panel: '#161B22',
          border: '#21262D',
          borderHover: '#30363D',
          text: '#E6EDF3',
          muted: '#7D8590',
        },
        verdict: {
          ac: '#3FB950',
          wa: '#F85149',
          tle: '#D29922',
          ce: '#D29922',
        },
        rating: {
          easy: '#4FA8E0',
          medium: '#C87DE8',
          hard: '#E0704F',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

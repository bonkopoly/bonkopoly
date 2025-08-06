/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bonk': {
          orange: '#ff6b35',
          yellow: '#f9ca24',
          purple: '#6c5ce7',
          dark: '#2d3436',
          space: '#0c0c0c'
        }
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'cyberpunk': ['Courier New', 'monospace']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bonk': 'bonk 0.5s ease-in-out',
        'rocket': 'rocket 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
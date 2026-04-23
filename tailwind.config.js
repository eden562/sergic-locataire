/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        foncia: {
          navy: '#1a3a6e',
          blue: '#1e4fa0',
          orange: '#e8610a',
          'orange-light': '#fff3ec',
          bg: '#f0f4fb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

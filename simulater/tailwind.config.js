/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#101524',
          800: '#161d31',
          700: '#222c48',
          600: '#344265',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'device-glow': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(59, 130, 246, 0.15)',
        'device-glow-farmer': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(16, 185, 129, 0.15)',
        'device-glow-user': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(245, 158, 11, 0.15)',
      }
    },
  },
  plugins: [],
}

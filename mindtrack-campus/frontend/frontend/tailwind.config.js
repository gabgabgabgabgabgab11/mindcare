/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        brand: ['Fraunces', 'Georgia', 'serif'],
        editorial: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#eff8f6',
          100: '#d8eeea',
          200: '#b8ddd6',
          300: '#8dc3ba',
          400: '#5ba399',
          500: '#3d8279',
          600: '#306c64',
          700: '#28574f',
          800: '#23473f',
          900: '#1d3934',
          950: '#102522',
        },
      },
    },
  },
  plugins: [],
}

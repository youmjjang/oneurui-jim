/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        metro: {
          line1: '#0052A4',
          line2: '#00A84D',
          line3: '#EF7C1C',
          line4: '#00A5DE',
          line5: '#996CAC',
          line6: '#CD7C2F',
          line7: '#747F00',
          line8: '#E6186C',
          line9: '#BDB092',
          airport: '#0090D2',
          sinbundang: '#D4003B',
          suin: '#F5A200'
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

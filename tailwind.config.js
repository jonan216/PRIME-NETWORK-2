/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          primary: '#F7F1E3',
          secondary: '#FBF8F1',
          card: '#FFFDF8',
          soft: '#F3E9D2',
          border: '#E5D8BE',
        },
        text: {
          primary: '#2C2925',
          secondary: '#746D63',
        },
        accent: {
          DEFAULT: '#B08D57',
          light: '#D6BD8A',
          hover: '#967542',
        },
        status: {
          success: '#4F7D5A',
          warning: '#B9853A',
          error: '#B85C5C',
        },
        nav: {
          dark: '#292722',
          hover: '#3A352E',
          active: '#B08D57',
          activeText: '#FFFDF8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        'cream': '12px',
        'cream-lg': '16px',
      },
      boxShadow: {
        'cream': '0 1px 3px rgba(44, 41, 37, 0.04), 0 4px 12px rgba(44, 41, 37, 0.06)',
        'cream-lg': '0 4px 20px rgba(44, 41, 37, 0.06)',
      }
    },
  },
  plugins: [],
}

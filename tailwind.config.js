/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Deep Green (Cilantro leaves)
        primary: {
          DEFAULT: '#2D5A27',
          light: '#4A7C44',
          dark: '#1E3D1A',
        },
        // Secondary - Fresh Blue (complementary)
        secondary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
        },
        // Accent - Warm Gold (spice-inspired)
        accent: '#D97706',
      },
    },
  },
  plugins: [],
}

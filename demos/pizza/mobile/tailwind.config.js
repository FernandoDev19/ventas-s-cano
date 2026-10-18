/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./src/shared/**/*.{js,jsx,ts,tsx}",
    "./src/core/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
        },
        background: {
          DEFAULT: "var(--color-background)",
        },
      },
      fontFamily: {
        body: ["var(--font-family-body)"],
      },
    },
  },
  plugins: [],
};

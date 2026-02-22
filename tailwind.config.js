/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí le decimos que busque en App y en cualquier archivo dentro de src
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
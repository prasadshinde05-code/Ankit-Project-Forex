/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F3A",
        steel: "#143C64",
        gold: "#C9A227",
        ink: "#1A1F29",
        muted: "#6B7684",
        offwhite: "#F5F7FA",
        line: "#D9DEE6",
        danger: "#B4472C",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#f0f2f5",
        bubbleOut: "#d9fdd3",
        bubbleIn: "#ffffff",
        brand: {
          50: "#eefbf3",
          100: "#d5f4e0",
          500: "#25d366",
          600: "#1fa855",
          700: "#128c42",
        },
        ink: "#111b21",
        muted: "#667781",
      },
    },
  },
  plugins: [],
};

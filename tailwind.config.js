/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        dyana: {
          bg: "#050910",
          gold: "#D4B472",
          blue: "#1E3A5F",
          text: "#E5E7EB",
          muted: "#9CA3AF",
          card: "#0B1020"
        }
      },
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

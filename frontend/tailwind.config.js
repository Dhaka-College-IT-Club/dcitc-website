/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"],
      },
      boxShadow: {
        "neon-glow-sm": "0 0 8px rgba(102, 252, 241, 0.7)",
        "neon-glow-md":
          "0 0 15px rgba(102, 252, 241, 0.8), 0 0 30px rgba(102, 252, 241, 0.5)",
        "neon-glow-lg":
          "0 0 20px 5px rgba(102, 252, 241, 0.9), 0 0 40px 10px rgba(102, 252, 241, 0.7)",
        "text-glow":
          "0 0 2px rgba(102, 252, 241, 0.8), 0 0 5px rgba(102, 252, 241, 0.6)",
      },
      transitionTimingFunction: {
        "ease-out-cubic": "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
      },
    },
  },
  plugins: [],
};

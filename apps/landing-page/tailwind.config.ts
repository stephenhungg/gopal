import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2e3231",
        sage: "#7fa69b",
        mist: "#949e9b",
        chalk: "#fafafa",
        fog: "#f3f5f1",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Crimson Text", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

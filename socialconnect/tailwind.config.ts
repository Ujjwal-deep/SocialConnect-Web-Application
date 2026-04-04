import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          base: "#0D0C0A",
          raised: "#141310",
          overlay: "#1C1A16",
          subtle: "#232018",
          muted: "#2E2A22",
        },
        amber: {
          50: "#FFF8EC",
          100: "#FAEEDA",
          200: "#FAC775",
          300: "#EF9F27",
          400: "#D4820F",
          500: "#BA7517",
          600: "#854F0B",
          700: "#633806",
          800: "#412402",
        },
        text: {
          primary: "#F5EDD8",
          secondary: "#A89880",
          muted: "#6B5F50",
          inverse: "#0D0C0A",
        },
        accent: {
          DEFAULT: "#EF9F27",
          hover: "#D4820F",
          muted: "#FAC77520",
          border: "#FAC77540",
        },
      },

      fontFamily: {
        display: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
        body: ["var(--font-body)", "DM Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;

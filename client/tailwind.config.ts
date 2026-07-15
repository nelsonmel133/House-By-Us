import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // House-By-Us brand tokens — grounded in Harare's red clay soil,
        // msasa/jacaranda greens, and brass-toned sun.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        clay: {
          50: "#FDF3EE",
          100: "#FAE3D6",
          200: "#F3C2A6",
          300: "#E89C72",
          400: "#DA7548",
          500: "#C2542D", // primary brand — red clay/brick
          600: "#A24323",
          700: "#82341B",
          800: "#5E2614",
          900: "#3E190D",
        },
        forest: {
          50: "#EEF3EE",
          100: "#D3E0D5",
          200: "#A6C1AB",
          300: "#719A79",
          400: "#48714F",
          500: "#1F3D2B", // deep msasa green
          600: "#1A3324",
          700: "#15291D",
          800: "#0F1E15",
          900: "#0A140E",
        },
        sand: {
          50: "#FEFDFB",
          100: "#FAF6EE", // warm cream background
          200: "#F2EBDA",
          300: "#E6D9BD",
          400: "#D6C399",
        },
        brass: {
          300: "#E8C988",
          400: "#DEB665",
          500: "#D4A24C", // gold/sun accent
          600: "#B5853A",
          700: "#8F692D",
        },
        ink: {
          50: "#F5F4F3",
          100: "#E7E4E1",
          400: "#5E5752",
          600: "#3A352F",
          800: "#241F1B",
          900: "#1C1917", // charcoal ink
        },
        slate: {
          850: "#1A2027",
          900: "#13171C",
        },
        primary: {
          DEFAULT: "#C2542D",
          foreground: "#FDF3EE",
        },
        secondary: {
          DEFAULT: "#1F3D2B",
          foreground: "#FAF6EE",
        },
        destructive: {
          DEFAULT: "#B3261E",
          foreground: "#FDF3EE",
        },
        muted: {
          DEFAULT: "#F2EBDA",
          foreground: "#5E5752",
        },
        accent: {
          DEFAULT: "#D4A24C",
          foreground: "#1C1917",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1917",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1917",
        },
        success: "#2F6B4F",
        warning: "#C2542D",
      },
      fontFamily: {
        display: ["'Fraunces'", "ui-serif", "Georgia", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(28,25,23,0.04), 0 1px 6px -1px rgba(28,25,23,0.06)",
        "card-hover": "0 4px 16px -2px rgba(28,25,23,0.12), 0 2px 6px -2px rgba(28,25,23,0.08)",
        pin: "0 2px 8px rgba(28,25,23,0.25)",
        panel: "0 0 0 1px rgba(28,25,23,0.06), 0 8px 24px -4px rgba(28,25,23,0.10)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pin-drop": {
          "0%": { transform: "translateY(-12px) scale(0.6)", opacity: "0" },
          "60%": { transform: "translateY(2px) scale(1.05)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pin-drop": "pin-drop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

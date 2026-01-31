/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        background: {
          primary: "#FFFFFF",
          secondary: "#FAFAFA",
          tertiary: "#F5F5F5",
          inverse: "#0A0A0A",
        },
        foreground: {
          primary: "#0A0A0A",
          secondary: "#404040",
          tertiary: "#737373",
          muted: "#A3A3A3",
          inverse: "#FFFFFF",
        },
        border: {
          DEFAULT: "#DEDEDE",
          subtle: "#EFEFEF",
          strong: "#D4D4D4",
        },
        accent: {
          DEFAULT: "#0A0A0A",
          hover: "#262626",
          subtle: "#F5F5F5",
        },
        status: {
          success: "#166534",
          "success-bg": "#F0FDF4",
          error: "#991B1B",
          "error-bg": "#FEF2F2",
          warning: "#92400E",
          "warning-bg": "#FFFBEB",
          info: "#1E40AF",
          "info-bg": "#EFF6FF",
        },
        // Gray palette
        gray: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0A0A0A",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "Times New Roman", "serif"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Consolas", "Monaco", "monospace"],
      },
      fontSize: {
        display: ["4rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h1: ["3rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        h2: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h3: ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        h4: ["1.25rem", { lineHeight: "1.4", letterSpacing: "0" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", letterSpacing: "0" }],
        body: ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", letterSpacing: "0" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        overline: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.07)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

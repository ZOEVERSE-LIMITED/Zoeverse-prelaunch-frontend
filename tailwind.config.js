/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: "rgb(var(--zoe-teal) / <alpha-value>)",
        "teal-ink": "rgb(var(--zoe-teal-ink) / <alpha-value>)",
        "teal-deep": "rgb(var(--zoe-teal-deep) / <alpha-value>)",
        "teal-wash": "rgb(var(--zoe-teal-wash) / <alpha-value>)",
        ink: "rgb(var(--zoe-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--zoe-ink-muted) / <alpha-value>)",
        "ink-soft": "rgb(var(--zoe-ink-soft) / <alpha-value>)",
        cream: "rgb(var(--zoe-cream) / <alpha-value>)",
        surface: "rgb(var(--zoe-surface) / <alpha-value>)",
        line: "rgb(var(--zoe-line) / <alpha-value>)",
        danger: "rgb(var(--zoe-danger) / <alpha-value>)",
        "danger-wash": "rgb(var(--zoe-danger-wash) / <alpha-value>)",
        success: "rgb(var(--zoe-success) / <alpha-value>)",
        "success-wash": "rgb(var(--zoe-success-wash) / <alpha-value>)",
        whatsapp: "rgb(var(--zoe-whatsapp) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Literata", "serif"],
        mono: ["DM Mono", "monospace"],
      },
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1rem" }],
        small: ["0.875rem", { lineHeight: "1.25rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        heading: ["1.25rem", { lineHeight: "1.75rem" }],
        title: ["1.5rem", { lineHeight: "2rem" }],
        display: ["2rem", { lineHeight: "2.5rem" }],
      },
      spacing: { gutter: "var(--zoe-gutter)" },
      maxWidth: { measure: "var(--zoe-measure)" },
      minHeight: { tap: "2.75rem" },
      borderRadius: {
        sm: "var(--zoe-radius-sm)",
        DEFAULT: "var(--zoe-radius)",
        lg: "var(--zoe-radius-lg)",
      },
      boxShadow: {
        card: "var(--zoe-shadow-card)",
        raised: "var(--zoe-shadow-raised)",
      },
    },
  },
  plugins: [],
};

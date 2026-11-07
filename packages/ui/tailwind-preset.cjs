const { hairlineWidth } = require("nativewind/theme");
const plugin = require("tailwindcss/plugin");
const tokens = require("./tokens.cjs");

const hsl = (name) => `hsl(var(--${name}) / <alpha-value>)`;
const tone = (name) => ({ DEFAULT: hsl(name), soft: hsl(`${name}-soft`), ink: hsl(`${name}-ink`) });

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`${__dirname}/src/**/*.{ts,tsx}`],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: hsl("border"),
        input: hsl("input"),
        ring: hsl("ring"),
        background: hsl("background"),
        foreground: hsl("foreground"),
        primary: { DEFAULT: hsl("primary"), foreground: hsl("primary-foreground") },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        destructive: { DEFAULT: hsl("destructive"), foreground: hsl("destructive-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        popover: { DEFAULT: hsl("popover"), foreground: hsl("popover-foreground") },
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },
        pink: tone("pink"),
        mint: tone("mint"),
        butter: tone("butter"),
      },
      fontFamily: {
        nunito: ["Nunito_600SemiBold"],
        "nunito-bold": ["Nunito_700Bold"],
        "nunito-black": ["Nunito_800ExtraBold"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addBase }) => addBase({ ":root": tokens.cssVars(tokens.light) })),
  ],
};

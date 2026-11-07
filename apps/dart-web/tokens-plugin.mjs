import tokens from "@purrphect/ui/tokens";
import plugin from "tailwindcss/plugin";

export default plugin(({ addBase }) =>
  addBase({
    ":root": { ...tokens.cssVars(tokens.light), "color-scheme": "light dark" },
    "@media (prefers-color-scheme: dark)": { ":root": tokens.cssVars(tokens.dark) },
  }),
);

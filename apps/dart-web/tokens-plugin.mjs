import tokens from "@purrphect/ui/tokens";
import plugin from "tailwindcss/plugin";

const vars = (set) => Object.fromEntries(Object.entries(set).map(([k, v]) => [`--${k}`, v]));

export default plugin(({ addBase }) =>
  addBase({
    ":root": { ...vars(tokens.light), "color-scheme": "light dark" },
    "@media (prefers-color-scheme: dark)": { ":root": vars(tokens.dark) },
  }),
);

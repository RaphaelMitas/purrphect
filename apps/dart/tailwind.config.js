const ui = require("@purrphect/ui/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", ...ui.content],
  presets: [ui],
};

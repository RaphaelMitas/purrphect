const { PRESETS, themeTokens } = require("./theme.cjs");

const preset = (id) => themeTokens(PRESETS.find((theme) => theme.id === id));

const tokens = {
  light: { ...preset("purrphect"), radius: "1rem" },
  dark: preset("midnight"),
};

const cssVars = (set) => Object.fromEntries(Object.entries(set).map(([k, v]) => [`--${k}`, v]));

module.exports = { ...tokens, cssVars };

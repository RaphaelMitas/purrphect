type TokenSet = Record<string, string>;

declare const tokens: {
  light: TokenSet;
  dark: TokenSet;
  cssVars: (set: TokenSet) => Record<string, string>;
};

export = tokens;

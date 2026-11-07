import type { TokenSet } from "./theme.cjs";

declare const tokens: {
  light: TokenSet & { radius: string };
  dark: TokenSet;
  cssVars: (set: Partial<TokenSet>) => Record<string, string>;
};

export = tokens;

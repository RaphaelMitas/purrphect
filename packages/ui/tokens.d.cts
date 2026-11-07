type TokenName =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "border"
  | "input"
  | "ring"
  | "radius"
  | "pink"
  | "pink-soft"
  | "pink-ink"
  | "mint"
  | "mint-soft"
  | "mint-ink"
  | "butter"
  | "butter-soft"
  | "butter-ink";
type TokenSet = Record<TokenName, string>;

declare const tokens: {
  light: TokenSet;
  dark: TokenSet;
  cssVars: (set: TokenSet) => Record<string, string>;
};

export = tokens;

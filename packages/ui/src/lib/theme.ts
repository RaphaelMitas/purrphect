import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from "expo-router/react-navigation";
import { createContext, useContext } from "react";
import { tripletToHex as hex, isDark, type TokenSet } from "../../theme.cjs";
import tokens from "../../tokens.cjs";

export function palette(set: TokenSet) {
  return {
    dark: isDark(set),
    background: hex(set.background),
    foreground: hex(set.foreground),
    card: hex(set.card),
    mutedForeground: hex(set["muted-foreground"]),
    border: hex(set.border),
    pink: hex(set.pink),
    mint: hex(set.mint),
    butter: hex(set.butter),
    boardFace: hex(set["board-face"]),
    boardSingle: hex(set["board-single"]),
    boardSingleAlt: hex(set["board-single-alt"]),
  };
}

export type Palette = ReturnType<typeof palette>;

export const PaletteContext = createContext<Palette>(palette(tokens.light));

export function usePalette(): Palette {
  return useContext(PaletteContext);
}

export function navigationTheme(p: Palette): NavigationTheme {
  const base = p.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: p.dark,
    colors: {
      ...base.colors,
      background: p.background,
      border: p.border,
      card: p.card,
      notification: p.pink,
      primary: p.pink,
      text: p.foreground,
    },
  };
}

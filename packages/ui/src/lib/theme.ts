import { DarkTheme, DefaultTheme, type Theme } from "expo-router/react-navigation";
import { useColorScheme } from "nativewind";
import tokens from "../../tokens.cjs";

function hex(triplet: string): string {
  const [h = 0, s = 0, l = 0] = triplet.split(" ").map((part) => Number.parseFloat(part));
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

function palette(set: typeof tokens.dark) {
  return {
    background: hex(set.background),
    foreground: hex(set.foreground),
    card: hex(set.card),
    muted: hex(set.muted),
    mutedForeground: hex(set["muted-foreground"]),
    border: hex(set.border),
    pink: hex(set.pink),
    pinkSoft: hex(set["pink-soft"]),
    mint: hex(set.mint),
    butter: hex(set.butter),
  };
}

export const PALETTE = { light: palette(tokens.light), dark: palette(tokens.dark) };

export type Palette = ReturnType<typeof palette>;

export function usePalette(): Palette {
  const { colorScheme } = useColorScheme();
  return PALETTE[colorScheme === "dark" ? "dark" : "light"];
}

const navTheme = (base: Theme, p: Palette): Theme => ({
  ...base,
  colors: {
    ...base.colors,
    background: p.background,
    border: p.border,
    card: p.card,
    notification: p.pink,
    primary: p.pink,
    text: p.foreground,
  },
});

export const NAV_THEME = {
  light: navTheme(DefaultTheme, PALETTE.light),
  dark: navTheme(DarkTheme, PALETTE.dark),
};

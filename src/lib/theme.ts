import { DarkTheme, DefaultTheme, type Theme } from "expo-router/react-navigation";
import { useColorScheme } from "nativewind";

export const PALETTE = {
  light: {
    background: "#FFF7F2",
    foreground: "#3B2A35",
    card: "#FFFFFF",
    muted: "#F6ECF0",
    mutedForeground: "#9A8590",
    border: "#F1E2E8",
    pink: "#FF6FA3",
    pinkSoft: "#FFE3EE",
    mint: "#5FCFAE",
    butter: "#FFD66B",
    boardSingleA: "#FFF7F2",
    boardSingleB: "#FFE3EE",
    boardFace: "#FFFFFF",
    catDetail: "#FFFFFF",
    blush: "#FFB3CD",
  },
  dark: {
    background: "#1C1418",
    foreground: "#FBEFF4",
    card: "#2A1F25",
    muted: "#33262D",
    mutedForeground: "#B49AA7",
    border: "#3D2E36",
    pink: "#FF6FA3",
    pinkSoft: "#4A2233",
    mint: "#5FCFAE",
    butter: "#FFD66B",
    boardSingleA: "#2E2228",
    boardSingleB: "#44283A",
    boardFace: "#241A1F",
    catDetail: "#FFFFFF",
    blush: "#FFB3CD",
  },
} as const;

export type Palette = (typeof PALETTE)["light"] | (typeof PALETTE)["dark"];

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

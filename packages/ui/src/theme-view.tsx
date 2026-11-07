import { vars } from "nativewind";
import { type ReactNode, useMemo } from "react";
import { View } from "react-native";
import { type Theme, themeTokens } from "../theme.cjs";
import tokens from "../tokens.cjs";
import { PaletteContext, palette } from "./lib/theme";

export function ThemeView({ theme, className, children }: { theme: Theme; className?: string; children: ReactNode }) {
  const { style, value } = useMemo(() => {
    const set = themeTokens(theme);
    return { style: vars(tokens.cssVars(set)), value: palette(set) };
  }, [theme]);
  return (
    <PaletteContext.Provider value={value}>
      <View className={className} style={style}>
        {children}
      </View>
    </PaletteContext.Provider>
  );
}

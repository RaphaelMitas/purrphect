import "../../global.css";

import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from "@expo-google-fonts/nunito";
import { navigationTheme, usePalette } from "@purrphect/ui/lib/theme";
import { ThemeView } from "@purrphect/ui/theme-view";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { SQLiteProvider } from "expo-sqlite";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { migrate } from "@/db/schema";
import { useSystemSlot, useThemes } from "@/hooks/useThemes";
import { slotTheme } from "@/lib/themes";

function Navigation() {
  const palette = usePalette();
  const theme = useMemo(() => navigationTheme(palette), [palette]);
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.background).catch(console.error);
  }, [palette.background]);
  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          statusBarStyle: palette.dark ? "light" : "dark",
        }}
      />
      <PortalHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const scheme = useSystemSlot();
  const themes = useThemes();
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  if (!fontsLoaded) return null;

  return (
    <SQLiteProvider databaseName="dart-purrphect.db" onInit={migrate}>
      <ThemeView theme={slotTheme(themes, scheme)} className="flex-1">
        <Navigation />
      </ThemeView>
    </SQLiteProvider>
  );
}

import "../../global.css";

import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from "@expo-google-fonts/nunito";
import { NAV_THEME, PALETTE } from "@purrphect/ui/lib/theme";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { migrate } from "@/db/schema";
import { LanguageProvider } from "@/i18n/LanguageProvider";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  if (!fontsLoaded) return null;

  return (
    <SQLiteProvider databaseName="dart-purrphect.db" onInit={migrate}>
      <LanguageProvider>
        <ThemeProvider value={NAV_THEME[scheme]}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: PALETTE[scheme].background } }}
          />
          <PortalHost />
        </ThemeProvider>
      </LanguageProvider>
    </SQLiteProvider>
  );
}

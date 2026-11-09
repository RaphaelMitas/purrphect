import { AppHeader } from "@purrphect/ui/app-header";
import { Icon } from "@purrphect/ui/icon";
import { Panel } from "@purrphect/ui/panel";
import { Segmented } from "@purrphect/ui/segmented";
import { Text } from "@purrphect/ui/text";
import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type SoundKind, setSoundEnabled, useSoundEnabled } from "@/hooks/useSoundSettings";
import { useThemes } from "@/hooks/useThemes";
import { useLanguage, useT } from "@/i18n/LanguageProvider";
import { LANGUAGE_OPTIONS } from "@/i18n/language";
import { slotTheme, themeName } from "@/lib/themes";

function SoundToggle({ kind, label }: { kind: SoundKind; label: string }) {
  const t = useT();
  const enabled = useSoundEnabled(kind);
  return (
    <View className="flex-row items-center gap-3">
      <Text className="flex-1 font-nunito-bold text-base">{label}</Text>
      <Segmented
        className="w-36"
        options={[
          { value: "on", label: t.settingsScreen.on },
          { value: "off", label: t.settingsScreen.off },
        ]}
        value={enabled ? "on" : "off"}
        onChange={(value) => setSoundEnabled(kind, value === "on")}
      />
    </View>
  );
}

export default function Settings() {
  const { t, preference, setPreference } = useLanguage();
  const themes = useThemes();
  const light = themeName(slotTheme(themes, "light"), t);
  const dark = themeName(slotTheme(themes, "dark"), t);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader title={t.settings} back backLabel={t.back} />
      <ScrollView contentContainerClassName="mx-auto w-full max-w-xl gap-4 p-4 pb-12">
        <Panel title={t.settingsScreen.language}>
          <Segmented
            options={[{ value: "system", label: t.settingsScreen.system }, ...LANGUAGE_OPTIONS]}
            value={preference}
            onChange={setPreference}
          />
        </Panel>
        <Panel title={t.settingsScreen.sound}>
          <View className="gap-3">
            <SoundToggle kind="knock" label={t.settingsScreen.dartHits} />
            <SoundToggle kind="caller" label={t.settingsScreen.caller} />
          </View>
        </Panel>
        <Panel title={t.theme.title}>
          <Link href="/theme" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.theme.title}: ${t.theme.lightMode} ${light}, ${t.theme.darkMode} ${dark}`}
              className="flex-row items-center gap-3 active:opacity-70"
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-nunito-bold text-base">
                  {t.theme.lightMode}: {light}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {t.theme.darkMode}: {dark}
                </Text>
              </View>
              <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
            </Pressable>
          </Link>
        </Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

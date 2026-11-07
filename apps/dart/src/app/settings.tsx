import { AppHeader } from "@purrphect/ui/app-header";
import { Panel } from "@purrphect/ui/panel";
import { Segmented } from "@purrphect/ui/segmented";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "@/i18n/LanguageProvider";
import { LANGUAGE_OPTIONS } from "@/i18n/language";

export default function Settings() {
  const { t, preference, setPreference } = useLanguage();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader title={t.settings} back backLabel={t.back} />
      <ScrollView contentContainerClassName="mx-auto w-full max-w-xl gap-4 p-4 pb-12">
        <Panel title={t.settingsScreen.language}>
          <View className="flex-row">
            <Segmented
              className="flex-1"
              options={[{ value: "system", label: t.settingsScreen.system }, ...LANGUAGE_OPTIONS]}
              value={preference}
              onChange={setPreference}
            />
          </View>
        </Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

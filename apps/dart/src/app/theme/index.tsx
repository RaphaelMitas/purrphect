import { AppHeader } from "@purrphect/ui/app-header";
import { Icon } from "@purrphect/ui/icon";
import { cn } from "@purrphect/ui/lib/utils";
import { Panel } from "@purrphect/ui/panel";
import { Text } from "@purrphect/ui/text";
import type { Theme } from "@purrphect/ui/theme";
import { ThemeView } from "@purrphect/ui/theme-view";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { Check, Moon, Pencil, Plus, Sun } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedStatusBar } from "@/components/theme/ThemedStatusBar";
import { ThemeThumb } from "@/components/theme/ThemePreview";
import { updateThemes, useSystemSlot, useThemes } from "@/hooks/useThemes";
import { useT } from "@/i18n/LanguageProvider";
import { allThemes, isCustom, type Slot, slotTheme, themeName, withSlot, withTheme } from "@/lib/themes";

const SLOTS = [
  { slot: "light", icon: Sun },
  { slot: "dark", icon: Moon },
] as const;

export default function ThemeScreen() {
  const t = useT();
  const themes = useThemes();
  const system = useSystemSlot();
  const [focus, setFocus] = useState<Slot>(system);
  const inSlot = { light: slotTheme(themes, "light"), dark: slotTheme(themes, "dark") };
  const focused = inSlot[focus];
  const slotLabel = (slot: Slot) => (slot === "dark" ? t.theme.darkMode : t.theme.lightMode);
  const labelTint = (slot: Slot) => (focus === slot ? "text-foreground" : "text-muted-foreground");

  const fork = (theme: Theme, name: string) => {
    const copy = { ...theme, id: randomUUID(), name };
    updateThemes((s) => withSlot(withTheme(s, copy), focus, copy.id));
    router.push(`/theme/${copy.id}`);
  };
  const edit = (theme: Theme) =>
    isCustom(themes, theme.id) ? router.push(`/theme/${theme.id}`) : fork(theme, t.theme.copyOf(themeName(theme, t)));

  return (
    <ThemeView theme={focused} className="flex-1">
      <ThemedStatusBar />
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <AppHeader title={t.theme.title} back backLabel={t.back} />
        <ScrollView contentContainerClassName="gap-4 p-4 pb-12">
          <View className="flex-row gap-3">
            {SLOTS.map(({ slot, icon }) => (
              <Pressable
                key={slot}
                accessibilityRole="button"
                accessibilityState={{ selected: focus === slot }}
                accessibilityLabel={`${slotLabel(slot)}: ${themeName(inSlot[slot], t)}`}
                onPress={() => setFocus(slot)}
                className={cn(
                  "flex-1 gap-2 rounded-3xl border-2 bg-card p-2.5 active:opacity-80",
                  focus === slot ? "border-foreground" : "border-border",
                )}
              >
                <View className="flex-row items-center gap-1.5">
                  <Icon as={icon} className={cn("size-4", labelTint(slot))} />
                  <Text className={cn("flex-1 font-nunito-black text-xs", labelTint(slot))}>{slotLabel(slot)}</Text>
                  {system === slot && (
                    <View className="rounded-full bg-mint-soft px-2">
                      <Text className="font-nunito-black text-[10px] text-mint-ink">{t.theme.now}</Text>
                    </View>
                  )}
                </View>
                <ThemeThumb theme={inSlot[slot]} height={72} />
                <Text className="font-nunito-black text-sm" numberOfLines={1}>
                  {themeName(inSlot[slot], t)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="-mt-2 px-1 text-xs text-muted-foreground">
            {themes.slots.light === themes.slots.dark ? t.theme.sameInBoth : t.theme.followsPhone}
          </Text>

          <Panel title={t.theme.themes} hint={focus === "dark" ? t.theme.forDark : t.theme.forLight}>
            <View className="flex-row flex-wrap gap-3">
              {allThemes(themes).map((theme) => {
                const selected = theme.id === focused.id;
                return (
                  <Pressable
                    key={theme.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={themeName(theme, t)}
                    accessibilityActions={[{ name: "longpress", label: t.theme.edit }]}
                    onAccessibilityAction={(e) => e.nativeEvent.actionName === "longpress" && edit(theme)}
                    onPress={() => updateThemes((s) => withSlot(s, focus, theme.id))}
                    onLongPress={() => edit(theme)}
                    className={cn(
                      "min-w-36 flex-1 basis-36 gap-2 rounded-3xl border-2 p-1.5 active:opacity-80",
                      selected ? "border-foreground" : "border-transparent",
                    )}
                  >
                    <ThemeThumb theme={theme} />
                    <View className="flex-row items-center gap-1 px-1">
                      <Text className="flex-1 font-nunito-black text-sm" numberOfLines={1}>
                        {themeName(theme, t)}
                      </Text>
                      {selected && <Icon as={Check} className="size-4 text-foreground" />}
                      {isCustom(themes, theme.id) && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t.theme.editNamed(themeName(theme, t))}
                          hitSlop={10}
                          onPress={() => edit(theme)}
                        >
                          <Icon as={Pencil} className="size-4 text-muted-foreground" />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                onPress={() => fork(focused, t.theme.myTheme)}
                className="min-h-28 min-w-36 flex-1 basis-36 items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-border active:opacity-70"
              >
                <Icon as={Plus} className="size-6 text-muted-foreground" />
                <Text className="font-nunito-black text-sm text-muted-foreground">{t.theme.newTheme}</Text>
              </Pressable>
            </View>
            <Text className="text-xs text-muted-foreground">{t.theme.longPressHint}</Text>
          </Panel>
        </ScrollView>
      </SafeAreaView>
    </ThemeView>
  );
}

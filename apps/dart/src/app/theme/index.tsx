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
import { allThemes, isCustom, type Slot, slotTheme, withSlot, withTheme } from "@/lib/themes";

const SLOTS = [
  { slot: "light", label: "Light mode", icon: Sun },
  { slot: "dark", label: "Dark mode", icon: Moon },
] as const;

export default function ThemeScreen() {
  const themes = useThemes();
  const system = useSystemSlot();
  const [focus, setFocus] = useState<Slot>(system);
  const inSlot = { light: slotTheme(themes, "light"), dark: slotTheme(themes, "dark") };
  const focused = inSlot[focus];
  const labelTint = (slot: Slot) => (focus === slot ? "text-foreground" : "text-muted-foreground");

  const fork = (theme: Theme, name: string) => {
    const copy = { ...theme, id: randomUUID(), name };
    updateThemes((s) => withSlot(withTheme(s, copy), focus, copy.id));
    router.push(`/theme/${copy.id}`);
  };
  const edit = (theme: Theme) =>
    isCustom(themes, theme.id) ? router.push(`/theme/${theme.id}`) : fork(theme, `Copy of ${theme.name}`);

  return (
    <ThemeView theme={focused} className="flex-1">
      <ThemedStatusBar />
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <AppHeader title="Theme" back />
        <ScrollView contentContainerClassName="gap-4 p-4 pb-12">
          <View className="flex-row gap-3">
            {SLOTS.map(({ slot, label, icon }) => (
              <Pressable
                key={slot}
                accessibilityRole="button"
                accessibilityState={{ selected: focus === slot }}
                accessibilityLabel={`${label}: ${inSlot[slot].name}`}
                onPress={() => setFocus(slot)}
                className={cn(
                  "flex-1 gap-2 rounded-3xl border-2 bg-card p-2.5 active:opacity-80",
                  focus === slot ? "border-foreground" : "border-border",
                )}
              >
                <View className="flex-row items-center gap-1.5">
                  <Icon as={icon} className={cn("size-4", labelTint(slot))} />
                  <Text className={cn("flex-1 font-nunito-black text-xs", labelTint(slot))}>{label}</Text>
                  {system === slot && (
                    <View className="rounded-full bg-mint-soft px-2">
                      <Text className="font-nunito-black text-[10px] text-mint-ink">NOW</Text>
                    </View>
                  )}
                </View>
                <ThemeThumb theme={inSlot[slot]} height={72} />
                <Text className="font-nunito-black text-sm" numberOfLines={1}>
                  {inSlot[slot].name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="-mt-2 px-1 text-xs text-muted-foreground">
            {themes.slots.light === themes.slots.dark
              ? "Same theme in both, so it never switches."
              : "Follows your phone. Put the same theme in both to never switch."}
          </Text>

          <Panel title="Themes" hint={`for ${focus} mode`}>
            <View className="flex-row flex-wrap gap-3">
              {allThemes(themes).map((theme) => {
                const selected = theme.id === focused.id;
                return (
                  <Pressable
                    key={theme.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={theme.name}
                    accessibilityActions={[{ name: "longpress", label: "Edit" }]}
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
                        {theme.name}
                      </Text>
                      {selected && <Icon as={Check} className="size-4 text-foreground" />}
                      {isCustom(themes, theme.id) && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${theme.name}`}
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
                onPress={() => fork(focused, "My theme")}
                className="min-h-28 min-w-36 flex-1 basis-36 items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-border active:opacity-70"
              >
                <Icon as={Plus} className="size-6 text-muted-foreground" />
                <Text className="font-nunito-black text-sm text-muted-foreground">New theme</Text>
              </Pressable>
            </View>
            <Text className="text-xs text-muted-foreground">Long press to edit. Built-in themes are copied first.</Text>
          </Panel>
        </ScrollView>
      </SafeAreaView>
    </ThemeView>
  );
}

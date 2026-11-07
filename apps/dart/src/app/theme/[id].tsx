import { AppHeader } from "@purrphect/ui/app-header";
import { Button } from "@purrphect/ui/button";
import { Icon } from "@purrphect/ui/icon";
import { Input } from "@purrphect/ui/input";
import { cn } from "@purrphect/ui/lib/utils";
import { Panel } from "@purrphect/ui/panel";
import { Slider } from "@purrphect/ui/slider";
import { Text } from "@purrphect/ui/text";
import { autoColors, MOODS, type Theme } from "@purrphect/ui/theme";
import { ThemeView } from "@purrphect/ui/theme-view";
import { PortalHost } from "@rn-primitives/portal";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ChevronRight, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorDialog } from "@/components/theme/ColorDialog";
import { ThemedStatusBar } from "@/components/theme/ThemedStatusBar";
import { ThemePreview } from "@/components/theme/ThemePreview";
import { updateThemes, useThemes } from "@/hooks/useThemes";
import { useT } from "@/i18n/LanguageProvider";
import { isAuto, ROLES, type RoleInfo, roleColor, themeName, withoutTheme, withUpdatedTheme } from "@/lib/themes";

const PORTAL = "theme-editor";
const WARMTH_STOPS = [0, 25, 50, 75, 100];

const persist = (theme: Theme) => updateThemes((s) => withUpdatedTheme(s, theme));

export default function EditThemeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const themes = useThemes();
  const [initial] = useState(() => themes.custom.find((t) => t.id === id));
  if (!initial) return <Redirect href="/theme" />;
  return <Editor initial={initial} />;
}

function Editor({ initial }: { initial: Theme }) {
  const t = useT();
  const [draft, setDraft] = useState(initial);
  const [role, setRole] = useState<RoleInfo | null>(null);
  const latest = useRef(draft);
  const saved = useRef(initial);
  const change = (patch: Partial<Theme>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    latest.current = draft;
    if (draft === saved.current) return;
    const timer = setTimeout(() => {
      saved.current = draft;
      persist(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft]);

  useEffect(
    () => () => {
      if (latest.current !== saved.current) persist(latest.current);
    },
    [],
  );

  const remove = () =>
    Alert.alert(t.theme.deleteTitle(themeName(draft, t)), t.theme.deleteBody, [
      { text: t.keep, style: "cancel" },
      {
        text: t.card.delete,
        style: "destructive",
        onPress: () => {
          updateThemes((s) => withoutTheme(s, draft.id));
          router.back();
        },
      },
    ]);

  const mood = MOODS.indexOf(draft.mood);

  return (
    <ThemeView theme={draft} className="flex-1">
      <ThemedStatusBar />
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <AppHeader
          title={t.theme.editTheme}
          back
          backLabel={t.back}
          right={
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <Text className="text-pink-ink">{t.theme.done}</Text>
            </Button>
          }
        />
        <ScrollView contentContainerClassName="gap-4 p-4 pb-12" keyboardShouldPersistTaps="handled">
          <Input
            value={draft.name}
            onChangeText={(name) => change({ name })}
            placeholder={t.theme.name}
            maxLength={24}
            accessibilityLabel={t.theme.name}
          />
          <ThemePreview />

          <Panel title={t.theme.feel} hint={draft.page ? t.theme.feelLocked : t.theme.feelHint}>
            <View className={cn("gap-3", draft.page && "opacity-40")} pointerEvents={draft.page ? "none" : "auto"}>
              <Text className="font-nunito-black text-sm">{t.theme.mood}</Text>
              <Slider
                label={t.theme.mood}
                valueText={t.theme.moods[draft.mood]}
                value={mood}
                min={0}
                max={MOODS.length - 1}
                colors={MOODS.map((m) => autoColors({ ...draft, mood: m, page: undefined }).page)}
                onChange={(i) => change({ mood: MOODS[i] ?? draft.mood })}
              />
              <View className="flex-row justify-between px-0.5">
                {MOODS.map((m) => (
                  <Text
                    key={m}
                    className={cn("text-[11px]", m === draft.mood ? "font-nunito-black" : "text-muted-foreground")}
                  >
                    {t.theme.moods[m]}
                  </Text>
                ))}
              </View>
              <View className="mt-1 flex-row justify-between">
                <Text className="font-nunito-black text-sm">{t.theme.warmth}</Text>
                <Text className="text-xs text-muted-foreground">{t.theme.coolWarm}</Text>
              </View>
              <Slider
                label={t.theme.warmth}
                value={draft.warmth}
                min={0}
                max={100}
                colors={WARMTH_STOPS.map(
                  (w) => autoColors({ ...draft, warmth: w, mood: "soft", page: undefined }).page,
                )}
                onChange={(warmth) => change({ warmth })}
              />
            </View>
          </Panel>

          <Panel title={t.theme.colours} className="gap-1">
            {ROLES.map((r) => (
              <Pressable
                key={r.key}
                accessibilityRole="button"
                onPress={() => setRole(r)}
                className="flex-row items-center gap-3 border-t border-border py-2.5 active:opacity-70"
              >
                <View
                  className="size-9 rounded-full border-2 border-border"
                  style={{ backgroundColor: roleColor(draft, r.key) }}
                />
                <View className="flex-1">
                  <Text className="font-nunito-bold text-base">{t.theme.roles[r.key].name}</Text>
                  <Text className="text-xs text-muted-foreground">{t.theme.roles[r.key].use}</Text>
                </View>
                {isAuto(draft, r.key) && (
                  <View className="rounded-full bg-muted px-2 py-0.5">
                    <Text className="font-nunito-black text-[11px] text-muted-foreground">{t.theme.auto}</Text>
                  </View>
                )}
                <Icon as={ChevronRight} className="size-4 text-muted-foreground" />
              </Pressable>
            ))}
          </Panel>

          <Button variant="outline" onPress={remove} className="h-12 rounded-2xl">
            <Icon as={Trash2} className="size-4 text-destructive-ink" />
            <Text className="text-destructive-ink">{t.theme.deleteTheme}</Text>
          </Button>
        </ScrollView>
      </SafeAreaView>
      {role && (
        <ColorDialog
          key={role.key}
          role={role}
          theme={draft}
          portalHost={PORTAL}
          onChange={change}
          onClose={() => setRole(null)}
        />
      )}
      <PortalHost name={PORTAL} />
    </ThemeView>
  );
}

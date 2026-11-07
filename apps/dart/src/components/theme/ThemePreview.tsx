import { Button } from "@purrphect/ui/button";
import { usePalette } from "@purrphect/ui/lib/theme";
import { Text } from "@purrphect/ui/text";
import type { Theme } from "@purrphect/ui/theme";
import { ThemeView } from "@purrphect/ui/theme-view";
import { View } from "react-native";
import { DartBoard } from "@/components/DartBoard";
import { ThrowerCard } from "@/components/match/ThrowerCard";

export function ThemeThumb({ theme, height = 88 }: { theme: Theme; height?: number }) {
  return (
    <ThemeView theme={theme}>
      <View
        className="flex-row items-center gap-2 overflow-hidden rounded-2xl border border-border bg-background p-2"
        style={{ height }}
      >
        <DartBoard size={height - 16} labels={false} />
        <View className="flex-1 gap-1.5">
          <View className="h-5 rounded-lg border-2 border-pink bg-card" />
          <View className="flex-row gap-1">
            <View className="h-3 flex-1 rounded-md bg-pink-soft" />
            <View className="h-3 flex-1 rounded-md bg-mint-soft" />
          </View>
          <View className="h-4 rounded-lg bg-pink" />
        </View>
      </View>
    </ThemeView>
  );
}

export function ThemePreview() {
  const { pink } = usePalette();
  return (
    <View className="gap-3">
      <ThrowerCard
        player={{ id: "preview", name: "Mia", color: pink, guest: false, deleted: false }}
        remaining={132}
        average={72.5}
        visitScore={60}
        legsWon={1}
        thrown={["T20"]}
        plan={["D16", "Bull"]}
        compact
      />
      <View className="flex-row items-center gap-3">
        <DartBoard size={140} />
        <View className="flex-1 gap-2">
          <View className="gap-1 rounded-3xl bg-card px-3 py-2">
            <Text className="text-sm">Leave 32 for D16.</Text>
            <Text className="text-xs text-butter-ink">Leo can finish first.</Text>
          </View>
          <Button className="h-12 rounded-2xl">
            <Text>New game</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

import { Button } from "@purrphect/ui/button";
import { Cat } from "@purrphect/ui/cat";
import { Text } from "@purrphect/ui/text";
import type { Theme } from "@purrphect/ui/theme";
import { ThemeView } from "@purrphect/ui/theme-view";
import { View } from "react-native";
import { DartBoard } from "@/components/DartBoard";
import { SegmentChip } from "@/components/SegmentChip";

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
  return (
    <View className="gap-3">
      <View className="gap-3 rounded-3xl border-2 border-pink bg-card p-3">
        <View className="flex-row items-center gap-3">
          <Cat size={40} />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-nunito-black text-lg">Mia</Text>
              <View className="rounded-full bg-pink px-2 py-0.5">
                <Text className="font-nunito-black text-[10px] text-primary-foreground">THROWING</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground">avg 72.5 · legs 1</Text>
          </View>
          <Text className="font-nunito-black text-5xl leading-[52px]">132</Text>
        </View>
        <View className="flex-row gap-2">
          <SegmentChip segment="T20" className="flex-1" />
          <SegmentChip segment="D16" className="flex-1" />
          <SegmentChip segment="Bull" className="flex-1" />
        </View>
      </View>
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

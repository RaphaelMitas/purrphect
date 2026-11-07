import { Cat } from "@purrphect/ui/cat";
import { cn } from "@purrphect/ui/lib/utils";
import { Text } from "@purrphect/ui/text";
import { View } from "react-native";
import { SegmentChip } from "@/components/SegmentChip";
import type { Player } from "@/db/repo";
import { label, type Segment } from "@/game/segments";

function DartSlots({
  thrown,
  plan,
  compact,
}: {
  thrown: readonly Segment[];
  plan: readonly Segment[];
  compact?: boolean;
}) {
  return (
    <View className="flex-row gap-2">
      {[0, 1, 2].map((i) => {
        const done = thrown[i];
        const next = plan[i - thrown.length];
        const h = compact ? "h-11" : "h-14";
        if (done) {
          return <SegmentChip key={i} segment={done} className={cn("flex-1 rounded-2xl", h)} />;
        }
        return (
          <View
            key={i}
            className={cn(
              "flex-1 items-center justify-center rounded-2xl border-2 border-dashed",
              h,
              i === thrown.length ? "border-pink" : "border-border",
            )}
          >
            <Text
              className={cn(
                "font-nunito-black text-lg",
                i === thrown.length ? "text-pink-ink" : "text-muted-foreground/50",
              )}
            >
              {next ? label(next) : "·"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ThrowerCard({
  player,
  remaining,
  average,
  visitScore,
  legsWon,
  thrown,
  plan,
  compact,
}: {
  player: Player;
  remaining: number;
  average: number;
  visitScore: number;
  legsWon: number;
  thrown: readonly Segment[];
  plan: readonly Segment[];
  compact?: boolean;
}) {
  return (
    <View className="gap-3 rounded-3xl border-[3px] bg-card p-3" style={{ borderColor: player.color }}>
      <View className="flex-row items-center gap-3">
        <Cat size={compact ? 34 : 44} color={player.color} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito-black text-lg" numberOfLines={1}>
              {player.name}
            </Text>
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: player.color }}>
              <Text className="font-nunito-black text-[10px] text-white">THROWING</Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground">
            avg <Text className="font-nunito-black text-xs">{average.toFixed(1)}</Text> · visit{" "}
            <Text className="font-nunito-black text-xs">{visitScore}</Text> · legs{" "}
            <Text className="font-nunito-black text-xs">{legsWon}</Text>
          </Text>
        </View>
        <Text className={cn("font-nunito-black", compact ? "text-5xl leading-[60px]" : "text-6xl leading-[72px]")}>
          {remaining}
        </Text>
      </View>
      <DartSlots thrown={thrown} plan={plan} compact={compact} />
    </View>
  );
}

import { View } from "react-native";
import { Cat } from "@/components/Cat";
import { SegmentChip } from "@/components/SegmentChip";
import { Text } from "@/components/ui/text";
import type { Player } from "@/db/repo";
import type { Suggestion } from "@/game/predict";
import { label, type Segment } from "@/game/segments";
import { percent } from "@/lib/format";

function Route({ darts }: { darts: readonly Segment[] }) {
  return (
    <View className="flex-row gap-1.5">
      {darts.map((d, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: routes repeat segments (T20 T20 Bull), position is the identity
        <SegmentChip key={i} segment={d} size="sm" />
      ))}
    </View>
  );
}

function names(players: Player[], remaining: (p: Player) => number): string {
  const shown = players.slice(0, 2).map((p) => `${p.name} (${remaining(p)})`);
  const more = players.length - shown.length;
  return more > 0 ? `${shown.join(", ")} +${more} more` : shown.join(" and ");
}

export function CatBubble({
  suggestion,
  onFinish,
  remainingOf,
  compact,
}: {
  suggestion: Suggestion;
  onFinish: Player[];
  remainingOf: (p: Player) => number;
  compact?: boolean;
}) {
  const { route, setup, fallback, remaining, chance } = suggestion;
  return (
    <View className="flex-row items-center gap-3">
      <Cat size={compact ? 36 : 56} />
      <View className="flex-1 gap-2 rounded-3xl bg-card px-4 py-3">
        {route ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">{remaining} left. Go</Text>
            <Route darts={route.darts} />
            <Text className="font-nunito-black text-sm text-pink-ink">{percent(chance)}</Text>
          </View>
        ) : setup && setup.leaves > 170 ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">{remaining} to go. Score big</Text>
            <Route darts={[setup.aim]} />
          </View>
        ) : setup ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">No out from {remaining}. Aim</Text>
            <Route darts={[setup.aim]} />
            <Text className="text-sm">to leave</Text>
            <Text className="font-nunito-black text-sm">{setup.leaves}</Text>
          </View>
        ) : null}
        {fallback && !compact && (
          <View className="flex-row flex-wrap items-center gap-2 border-t border-dashed border-border pt-2">
            <Text className="text-xs text-muted-foreground">
              Miss into the {label(fallback.single)}? Then {fallback.leaves}:
            </Text>
            {fallback.route ? (
              <Route darts={fallback.route.darts} />
            ) : fallback.setup ? (
              <>
                <Text className="text-xs text-muted-foreground">aim</Text>
                <Route darts={[fallback.setup.aim]} />
              </>
            ) : (
              <Text className="text-xs">just score</Text>
            )}
          </View>
        )}
        {onFinish.length > 0 && (
          <Text className="text-xs text-butter-ink">{names(onFinish, remainingOf)} can finish before you're back.</Text>
        )}
      </View>
    </View>
  );
}

import { Cat } from "@purrphect/ui/cat";
import { Text } from "@purrphect/ui/text";
import { View } from "react-native";
import type { QueueEntry } from "@/components/match/UpNext";
import { SegmentChip } from "@/components/SegmentChip";
import type { Suggestion } from "@/game/predict";
import { label, type Segment } from "@/game/segments";
import type { Messages } from "@/i18n/en";
import { useT } from "@/i18n/LanguageProvider";
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

function names(t: Messages, entries: QueueEntry[]): string {
  const shown = entries.slice(0, 2).map((e) => `${e.player.name} (${e.remaining})`);
  const more = entries.length - shown.length;
  return more > 0 ? t.match.more(shown.join(", "), more) : t.and(shown);
}

export function CatBubble({
  suggestion,
  onFinish,
  compact,
}: {
  suggestion: Suggestion;
  onFinish: QueueEntry[];
  compact?: boolean;
}) {
  const t = useT();
  const { route, setup, fallback, remaining, chance, getIn } = suggestion;
  return (
    <View className="flex-row items-center gap-3">
      <Cat size={compact ? 36 : 56} />
      <View className="flex-1 gap-2 rounded-3xl bg-card px-4 py-3">
        {getIn ? (
          <Text className="text-sm">{t.match.getIn[getIn]}</Text>
        ) : route ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">{t.match.checkoutGo(remaining)}</Text>
            <Route darts={route.darts} />
            <Text className="font-nunito-black text-sm text-pink-ink">{percent(t, chance)}</Text>
          </View>
        ) : setup && setup.leaves > 170 ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">{t.match.scoreBig(remaining)}</Text>
            <Route darts={[setup.aim]} />
          </View>
        ) : setup ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm">{t.match.noOut(remaining)}</Text>
            <Route darts={[setup.aim]} />
            <Text className="text-sm">{t.match.toLeave}</Text>
            <Text className="font-nunito-black text-sm">{setup.leaves}</Text>
          </View>
        ) : null}
        {fallback && !compact && (
          <View className="flex-row flex-wrap items-center gap-2 border-t border-dashed border-border pt-2">
            <Text className="text-xs text-muted-foreground">
              {t.match.missInto(label(fallback.single), fallback.leaves)}
            </Text>
            {fallback.route ? (
              <Route darts={fallback.route.darts} />
            ) : fallback.setup ? (
              <>
                <Text className="text-xs text-muted-foreground">{t.match.aim}</Text>
                <Route darts={[fallback.setup.aim]} />
              </>
            ) : (
              <Text className="text-xs">{t.match.justScore}</Text>
            )}
          </View>
        )}
        {onFinish.length > 0 && (
          <Text className="text-xs text-butter-ink">{t.match.canFinish(names(t, onFinish), onFinish.length)}</Text>
        )}
      </View>
    </View>
  );
}

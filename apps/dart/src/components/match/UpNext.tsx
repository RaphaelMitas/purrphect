import { Cat } from "@purrphect/ui/cat";
import { cn } from "@purrphect/ui/lib/utils";
import { RankRow } from "@purrphect/ui/rank-row";
import { Text } from "@purrphect/ui/text";
import { useRef } from "react";
import { ScrollView, type ScrollViewInstance, View } from "react-native";
import { SegmentChips } from "@/components/SegmentChip";
import type { Player } from "@/db/repo";
import type { Route } from "@/game/checkout";
import type { VisitRecord } from "@/game/x01";
import { useT } from "@/i18n/LanguageProvider";

export interface QueueEntry {
  player: Player;
  remaining: number;
  out: Route | undefined;
}

export interface HistoryEntry {
  id: number;
  player: Player;
  visit: VisitRecord;
}

function VisitRow({ entry: { player, visit }, faded }: { entry: HistoryEntry; faded?: boolean }) {
  return (
    <View className={cn("h-9 flex-row items-center gap-2 px-1", faded && "opacity-50")}>
      <Cat size={16} color={player.color} blush={false} />
      <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
        {player.name}
      </Text>
      <SegmentChips darts={visit.darts} />
      <Text className={cn("w-8 text-right font-nunito-black text-sm", visit.bust && "text-destructive-ink")}>
        {visit.scored}
      </Text>
      <Text className="w-11 text-right text-xs text-muted-foreground">→ {visit.scoreBefore - visit.scored}</Text>
    </View>
  );
}

export function RecentVisits({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return null;
  return (
    <View>
      {history.map((entry, i) => (
        <VisitRow key={entry.id} entry={entry} faded={i < history.length - 1} />
      ))}
    </View>
  );
}

export function LegTimeline({
  history,
  thrower,
  remaining,
  entries,
}: {
  history: HistoryEntry[];
  thrower: Player;
  remaining: number;
  entries: QueueEntry[];
}) {
  const t = useT();
  const past = useRef<ScrollViewInstance>(null);
  const showLatest = () => past.current?.scrollToEnd({ animated: false });
  return (
    <View className="flex-1 gap-1 rounded-3xl bg-card px-3 py-2">
      <ScrollView
        ref={past}
        className="flex-1"
        contentContainerClassName="grow justify-end"
        onLayout={showLatest}
        onContentSizeChange={showLatest}
      >
        {history.map((entry) => (
          <VisitRow key={entry.id} entry={entry} faded />
        ))}
      </ScrollView>
      <RankRow rank="" color={thrower.color} name={thrower.name} highlight>
        <Text className="font-nunito-black text-[10px] text-butter-ink">{t.match.throwing}</Text>
        <Text className="w-12 text-right font-nunito-black text-lg">{remaining}</Text>
      </RankRow>
      <Text className="mt-1 px-1 font-nunito-black text-xs text-muted-foreground">{t.match.upNext}</Text>
      <ScrollView className="max-h-[40%] grow-0">
        {entries.map((e, i) => (
          <RankRow key={e.player.id} rank={i + 1} color={e.player.color} name={e.player.name}>
            <Text className="w-12 text-right font-nunito-black text-lg">{e.remaining}</Text>
          </RankRow>
        ))}
      </ScrollView>
    </View>
  );
}

export function PlayerStrip({ entries }: { entries: QueueEntry[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerClassName="gap-2">
      {entries.map((e) => (
        <View key={e.player.id} className="flex-row items-center gap-1.5 rounded-xl bg-card px-2.5 py-1.5">
          <Cat size={16} color={e.player.color} blush={false} />
          <View>
            <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
              {e.player.name}
            </Text>
            <Text className="font-nunito-black text-base leading-5">{e.remaining}</Text>
          </View>
          {e.out && <View className="h-2 w-2 rounded-full bg-mint" />}
        </View>
      ))}
    </ScrollView>
  );
}

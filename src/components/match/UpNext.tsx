import { ScrollView, View } from "react-native";
import { Cat } from "@/components/Cat";
import { Panel } from "@/components/Panel";
import { RankRow } from "@/components/RankRow";
import { Text } from "@/components/ui/text";
import type { Player } from "@/db/repo";
import type { Route } from "@/game/checkout";
import { label } from "@/game/segments";

export interface QueueEntry {
  player: Player;
  remaining: number;
  average: number;
  out: Route | undefined;
}

export function UpNextList({ entries }: { entries: QueueEntry[] }) {
  return (
    <Panel title="Up next" hint={`${entries.length + 1} left`} className="flex-1 gap-1 px-3 py-2">
      <ScrollView>
        {entries.map((e, i) => (
          <RankRow key={e.player.id} rank={i + 1} color={e.player.color} name={e.player.name} highlight={i === 0}>
            {e.out && (
              <View className="rounded-md bg-mint-soft px-1.5 py-0.5">
                <Text className="font-nunito-black text-[10px] text-mint-ink">{e.out.darts.map(label).join(" ")}</Text>
              </View>
            )}
            <Text className="w-10 text-right text-xs text-muted-foreground">{e.average.toFixed(1)}</Text>
            <Text className="w-12 text-right font-nunito-black text-lg">{e.remaining}</Text>
          </RankRow>
        ))}
      </ScrollView>
    </Panel>
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

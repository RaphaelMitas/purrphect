import { ScrollView, View } from "react-native";
import { Cat } from "@/components/Cat";
import { Text } from "@/components/ui/text";
import type { Player } from "@/db/repo";
import type { Route } from "@/game/checkout";
import { label } from "@/game/segments";
import { cn } from "@/lib/utils";

export interface QueueEntry {
  player: Player;
  remaining: number;
  average: number;
  out: Route | undefined;
}

export function UpNextList({ entries }: { entries: QueueEntry[] }) {
  return (
    <View className="flex-1 rounded-3xl bg-card px-3 py-2">
      <View className="flex-row justify-between pb-1">
        <Text className="font-nunito-black text-sm">Up next</Text>
        <Text className="text-xs text-muted-foreground">{entries.length + 1} players</Text>
      </View>
      <ScrollView>
        {entries.map((e, i) => (
          <View
            key={e.player.id}
            className={cn(
              "h-10 flex-row items-center gap-2 border-t border-border px-1",
              i === 0 && "rounded-xl border-transparent bg-butter-soft",
            )}
          >
            <Text className="w-4 text-center font-nunito-black text-[11px] text-muted-foreground">{i + 1}</Text>
            <Cat size={20} color={e.player.color} blush={false} />
            <Text className="flex-1 font-nunito-bold text-sm" numberOfLines={1}>
              {e.player.name}
            </Text>
            {e.out && (
              <View className="rounded-md bg-mint-soft px-1.5 py-0.5">
                <Text className="font-nunito-black text-[10px] text-mint-ink">{e.out.darts.map(label).join(" ")}</Text>
              </View>
            )}
            <Text className="w-10 text-right text-xs text-muted-foreground">{e.average.toFixed(1)}</Text>
            <Text className="w-12 text-right font-nunito-black text-lg">{e.remaining}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function PlayerStrip({ entries }: { entries: QueueEntry[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
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

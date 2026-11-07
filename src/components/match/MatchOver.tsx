import { View } from "react-native";
import { Cat } from "@/components/Cat";
import { RankRow } from "@/components/RankRow";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { Player } from "@/db/repo";

interface Standing {
  player: Player;
  legsWon: number;
  average: number;
}

export function MatchOver({
  standings,
  onUndo,
  onRematch,
  onHome,
  busy,
}: {
  standings: Standing[];
  onUndo: () => void;
  onRematch: () => void;
  onHome: () => void;
  busy: boolean;
}) {
  const winner = standings[0];
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/40 p-6">
      <View className="w-full max-w-md gap-4 rounded-3xl bg-card p-6">
        <View className="items-center gap-2">
          <Cat size={72} color={winner?.player.color} />
          <Text className="font-nunito-black text-2xl">{winner?.player.name} wins!</Text>
        </View>
        <View>
          {standings.map((s, i) => (
            <RankRow key={s.player.id} rank={`${i + 1}.`} color={s.player.color} name={s.player.name}>
              <Text className="text-xs text-muted-foreground">avg {s.average.toFixed(1)}</Text>
              <Text className="w-14 text-right font-nunito-black">{s.legsWon} legs</Text>
            </RankRow>
          ))}
        </View>
        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1 rounded-2xl" disabled={busy} onPress={onUndo}>
            <Text>Undo</Text>
          </Button>
          <Button variant="secondary" className="flex-1 rounded-2xl" disabled={busy} onPress={onHome}>
            <Text>Home</Text>
          </Button>
          <Button className="flex-1 rounded-2xl" disabled={busy} onPress={onRematch}>
            <Text>Rematch</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

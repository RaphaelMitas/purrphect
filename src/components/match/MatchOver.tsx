import { View } from "react-native";
import { Cat } from "@/components/Cat";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { Player } from "@/db/repo";

export interface Standing {
  player: Player;
  legsWon: number;
  average: number;
}

export function MatchOver({
  standings,
  onUndo,
  onRematch,
  onHome,
}: {
  standings: Standing[];
  onUndo: () => void;
  onRematch: () => void;
  onHome: () => void;
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
            <View key={s.player.id} className="h-10 flex-row items-center gap-2 border-t border-border">
              <Text className="w-6 font-nunito-black text-sm text-muted-foreground">{i + 1}.</Text>
              <Cat size={20} color={s.player.color} blush={false} />
              <Text className="flex-1 font-nunito-bold">{s.player.name}</Text>
              <Text className="text-xs text-muted-foreground">avg {s.average.toFixed(1)}</Text>
              <Text className="w-14 text-right font-nunito-black">{s.legsWon} legs</Text>
            </View>
          ))}
        </View>
        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1 rounded-2xl" onPress={onUndo}>
            <Text className="font-nunito-black">Undo</Text>
          </Button>
          <Button variant="secondary" className="flex-1 rounded-2xl" onPress={onHome}>
            <Text className="font-nunito-black">Home</Text>
          </Button>
          <Button className="flex-1 rounded-2xl" onPress={onRematch}>
            <Text className="font-nunito-black">Rematch</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

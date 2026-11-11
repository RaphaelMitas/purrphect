import { Button } from "@purrphect/ui/button";
import { Cat } from "@purrphect/ui/cat";
import { RankRow } from "@purrphect/ui/rank-row";
import { Text } from "@purrphect/ui/text";
import { View } from "react-native";
import type { Player } from "@/db/repo";
import { useT } from "@/i18n/LanguageProvider";
import { decimal } from "@/lib/format";

interface Standing {
  player: Player;
  legsWon: number;
  average: number;
}

export function MatchOver({
  standings,
  ended,
  onUndo,
  onRematch,
  onHome,
  busy,
}: {
  standings: Standing[];
  ended: boolean;
  onUndo: () => void;
  onRematch: () => void;
  onHome: () => void;
  busy: boolean;
}) {
  const t = useT();
  const winner = standings[0];
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/40 p-6">
      <View className="w-full max-w-md gap-4 rounded-3xl bg-card p-6">
        <View className="items-center gap-2">
          <Cat size={72} color={winner?.player.color} />
          <Text className="font-nunito-black text-2xl">
            {ended ? t.match.gameEnded : t.match.wins(winner?.player.name ?? "")}
          </Text>
        </View>
        <View>
          {standings.map((s, i) => (
            <RankRow key={s.player.id} rank={`${i + 1}.`} color={s.player.color} name={s.player.name}>
              <Text className="text-xs text-muted-foreground">
                {t.match.avg} {decimal(t, s.average)}
              </Text>
              <Text className="w-14 text-right font-nunito-black">{t.match.legsWon(s.legsWon)}</Text>
            </RankRow>
          ))}
        </View>
        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1 rounded-2xl" disabled={busy} onPress={onUndo}>
            <Text numberOfLines={1} adjustsFontSizeToFit>
              {ended ? t.match.keepPlaying : t.undo}
            </Text>
          </Button>
          <Button variant="secondary" className="flex-1 rounded-2xl" disabled={busy} onPress={onHome}>
            <Text numberOfLines={1} adjustsFontSizeToFit>
              {t.match.home}
            </Text>
          </Button>
          <Button className="flex-1 rounded-2xl" disabled={busy} onPress={onRematch}>
            <Text numberOfLines={1} adjustsFontSizeToFit>
              {t.match.rematch}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

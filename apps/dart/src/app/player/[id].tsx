import { AppHeader } from "@purrphect/ui/app-header";
import { Cat } from "@purrphect/ui/cat";
import { useWide } from "@purrphect/ui/hooks/use-wide";
import { usePalette } from "@purrphect/ui/lib/theme";
import { cn } from "@purrphect/ui/lib/utils";
import { Meter } from "@purrphect/ui/meter";
import { Panel } from "@purrphect/ui/panel";
import { RankRow } from "@purrphect/ui/rank-row";
import { Text } from "@purrphect/ui/text";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DartBoard } from "@/components/DartBoard";
import { RateBars, TrendChart } from "@/components/StatCharts";
import { byId, loadPlayersAndMatches } from "@/db/repo";
import { BADGES, LEVELS, progressFor, XP_RULES } from "@/game/levels";
import { doubleRates, playerStats, rangeRates } from "@/game/stats";
import { replay, standings } from "@/game/x01";
import { useFocusData } from "@/hooks/useFocusData";
import { ordinal, percent, relativeDay } from "@/lib/format";

export default function PlayerCard() {
  const wide = useWide();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data] = useFocusData(loadPlayersAndMatches);
  const players = useMemo(() => byId(data?.players ?? []), [data]);
  const player = players.get(id);
  const matches = data?.matches ?? [];

  const stats = useMemo(() => playerStats(matches, id), [matches, id]);
  const progress = useMemo(() => progressFor(stats), [stats]);

  const recent = useMemo(
    () =>
      matches
        .filter((m) => m.playerIds.includes(id))
        .slice(-6)
        .reverse()
        .map((m) => {
          const state = replay(m.rules, m.playerIds.length, m.segments);
          const me = m.playerIds.indexOf(id);
          const others = m.playerIds.filter((p) => p !== id);
          const vs =
            others.length === 1 ? (players.get(others[0] ?? "")?.name ?? "?") : `${m.playerIds.length} players`;
          const result =
            m.playerIds.length === 2
              ? `${state.legsWon[me] ?? 0} – ${state.legsWon[1 - me] ?? 0}`
              : ordinal(standings(state).indexOf(me) + 1);
          return { id: m.id, vs, when: relativeDay(m.finishedAt), start: m.rules.start, result };
        }),
    [matches, id, players],
  );

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <AppHeader title="Player" back />
        {data && <Text className="p-6 text-center text-muted-foreground">This player doesn't exist anymore.</Text>}
      </SafeAreaView>
    );
  }

  const span = (progress.nextXp ?? progress.xp) - progress.levelXp;
  const share = progress.nextXp ? (progress.xp - progress.levelXp) / Math.max(1, span) : 1;

  const profile = (
    <View className="items-center gap-3 rounded-3xl bg-card p-5">
      <Cat size={96} color={player.color} />
      <Text className="font-nunito-black text-2xl">{player.name}</Text>
      <View className="rounded-full bg-butter-soft px-3 py-1">
        <Text className="font-nunito-black text-sm text-butter-ink">
          Lv. {progress.level} · {progress.name}
        </Text>
      </View>
      <View className="w-full gap-1">
        <Meter value={share} />
        <Text className="text-center text-xs text-muted-foreground">
          {progress.nextXp
            ? `${progress.xp} / ${progress.nextXp} XP · ${progress.nextXp - progress.xp} to ${progress.nextName}`
            : `${progress.xp} XP · top level`}
        </Text>
      </View>
      <View className="flex-row gap-6">
        {[
          [stats.average.toFixed(1), "avg"],
          [percent(stats.checkoutRate), "checkout"],
          [String(stats.legsWon), "legs won"],
        ].map(([v, l]) => (
          <View key={l} className="items-center">
            <Text className="font-nunito-black text-2xl">{v}</Text>
            <Text className="text-xs text-muted-foreground">{l}</Text>
          </View>
        ))}
      </View>
      {progress.badges.length > 0 && (
        <View className="flex-row flex-wrap justify-center gap-1.5">
          {progress.badges.map((b, i) => (
            <View key={b} className={cn("rounded-xl px-2.5 py-1", i % 2 ? "bg-mint-soft" : "bg-pink-soft")}>
              <Text className={cn("font-nunito-black text-xs", i % 2 ? "text-mint-ink" : "text-pink-ink")}>
                {BADGES[b]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const levels = (
    <Panel title="Levels" hint={`${progress.xp} XP`}>
      <View className="flex-row flex-wrap gap-1.5">
        {XP_RULES.map((r) => (
          <View key={r.key} className="flex-row gap-1 rounded-lg bg-background px-2 py-1">
            <Text className="text-[11px]">{r.label}</Text>
            <Text className="font-nunito-black text-[11px] text-pink-ink">+{r.xp}</Text>
          </View>
        ))}
      </View>
      {LEVELS.map((l, i) => {
        const reached = i + 1 <= progress.level;
        const current = i + 1 === progress.level;
        return (
          <RankRow
            key={l.name}
            rank={i + 1}
            color={reached ? player.color : palette.border}
            name={l.name}
            highlight={current}
            muted={!reached}
          >
            <Text className="text-xs text-muted-foreground">{current ? "now" : reached ? "done" : `${l.xp} XP`}</Text>
          </RankRow>
        );
      })}
    </Panel>
  );

  const game = (
    <View className="gap-4">
      <Panel title="Where your darts land" hint={`${stats.darts} darts`} className="items-center">
        <DartBoard size={wide ? 320 : 300} heat={stats.heat} />
      </Panel>
      <Panel title="Checkout by range" hint="finishable visits">
        <RateBars rows={rangeRates(stats)} />
        {doubleRates(stats, 1).map((d) => (
          <Text key={d.label} className="text-xs text-muted-foreground">
            Most tried double <Text className="font-nunito-black text-xs">{d.label}</Text> · {percent(d.rate)}
          </Text>
        ))}
      </Panel>
      <Panel title="Form" hint="average per match">
        <TrendChart points={stats.trend.slice(-12)} height={120} />
      </Panel>
      <Panel title="Recent matches">
        {recent.length === 0 && <Text className="text-sm text-muted-foreground">No finished matches yet.</Text>}
        {recent.map((r) => (
          <View key={r.id} className="h-9 flex-row items-center gap-2 border-t border-border">
            <Text className="flex-1 font-nunito-bold text-sm">{r.vs}</Text>
            <Text className="text-xs text-muted-foreground">
              {r.when} · {r.start}
            </Text>
            <Text className="w-14 text-right font-nunito-black text-sm">{r.result}</Text>
          </View>
        ))}
      </Panel>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader title={player.name} back />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-12">
        {wide ? (
          <View className="flex-row gap-4">
            <View className="flex-1 gap-4">
              {profile}
              {levels}
            </View>
            <View className="flex-[1.3]">{game}</View>
          </View>
        ) : (
          <>
            {profile}
            {game}
            {levels}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

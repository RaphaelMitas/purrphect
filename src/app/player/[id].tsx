import { useLocalSearchParams } from "expo-router";
import type { SQLiteDatabase } from "expo-sqlite";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { Cat } from "@/components/Cat";
import { DartBoard } from "@/components/DartBoard";
import { Panel } from "@/components/Panel";
import { RateBars, TrendChart } from "@/components/StatCharts";
import { Text } from "@/components/ui/text";
import { finishedMatches, listPlayers } from "@/db/repo";
import { BADGES, LEVELS, progressFor, XP_RULES } from "@/game/levels";
import { averageTrend, doubleRates, playerStats } from "@/game/stats";
import { replay } from "@/game/x01";
import { useFocusData } from "@/hooks/useFocusData";
import { useWide } from "@/hooks/useWide";
import { ordinal, relativeDay } from "@/lib/format";
import { usePalette } from "@/lib/theme";
import { cn } from "@/lib/utils";

async function loadPlayer(db: SQLiteDatabase) {
  const [players, matches] = await Promise.all([listPlayers(db), finishedMatches(db)]);
  return { players, matches };
}

export default function PlayerCard() {
  const wide = useWide();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data] = useFocusData(loadPlayer);
  const player = data?.players.find((p) => p.id === id);
  const matches = data?.matches ?? [];

  const progress = useMemo(() => progressFor(matches, id), [matches, id]);
  const stats = useMemo(() => playerStats(matches, id), [matches, id]);
  const trend = useMemo(() => averageTrend(matches, id), [matches, id]);
  const names = useMemo(() => new Map((data?.players ?? []).map((p) => [p.id, p.name])), [data]);

  const recent = useMemo(
    () =>
      matches
        .filter((m) => m.playerIds.includes(id))
        .slice(-6)
        .reverse()
        .map((m) => {
          const state = replay(m.rules, m.playerIds.length, m.segments);
          const me = m.playerIds.indexOf(id);
          const rank =
            [...state.legsWon.keys()].sort((a, b) => (state.legsWon[b] ?? 0) - (state.legsWon[a] ?? 0)).indexOf(me) + 1;
          const others = m.playerIds.filter((p) => p !== id);
          const vs = others.length === 1 ? (names.get(others[0] ?? "") ?? "?") : `${m.playerIds.length} players`;
          const result =
            m.playerIds.length === 2
              ? `${state.legsWon[me] ?? 0} – ${state.legsWon[1 - me] ?? 0}`
              : state.winner === me
                ? "1st"
                : ordinal(rank);
          return { id: m.id, vs, when: relativeDay(m.finishedAt), start: m.rules.start, result };
        }),
    [matches, id, names],
  );

  if (!player) return <SafeAreaView className="flex-1 bg-background" />;

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
        <View className="h-3 overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-pink" style={{ width: `${Math.round(share * 100)}%` }} />
        </View>
        <Text className="text-center text-xs text-muted-foreground">
          {progress.nextXp
            ? `${progress.xp} / ${progress.nextXp} XP · ${progress.nextXp - progress.xp} to ${progress.nextName}`
            : `${progress.xp} XP · top level`}
        </Text>
      </View>
      <View className="flex-row gap-6">
        {[
          [stats.average.toFixed(1), "avg"],
          [`${Math.round(stats.checkoutRate * 100)}%`, "checkout"],
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
          <View
            key={l.name}
            className={cn(
              "h-9 flex-row items-center gap-2 border-t border-border px-1",
              current && "rounded-xl border-transparent bg-butter-soft",
            )}
          >
            <Text className="w-5 text-center font-nunito-black text-xs text-muted-foreground">{i + 1}</Text>
            <Cat size={18} color={reached ? player.color : palette.border} blush={false} />
            <Text className={cn("flex-1 font-nunito-bold text-sm", !reached && "text-muted-foreground")}>{l.name}</Text>
            <Text className="text-xs text-muted-foreground">{current ? "now" : reached ? "done" : `${l.xp} XP`}</Text>
          </View>
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
        <RateBars
          rows={stats.byRange.map((r) => ({
            label: r.label,
            rate: r.chances ? r.hits / r.chances : 0,
            detail: `${r.hits}/${r.chances}`,
          }))}
        />
        {doubleRates(stats, 1).map((d) => (
          <Text key={d.label} className="text-xs text-muted-foreground">
            Most tried double <Text className="font-nunito-black text-xs">{d.label}</Text> · {Math.round(d.rate * 100)}%
          </Text>
        ))}
      </Panel>
      <Panel title="Form" hint="average per match">
        <TrendChart points={trend.slice(-12)} height={120} />
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

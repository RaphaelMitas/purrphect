import { AppHeader } from "@purrphect/ui/app-header";
import { Button } from "@purrphect/ui/button";
import { Cat } from "@purrphect/ui/cat";
import { useWide } from "@purrphect/ui/hooks/use-wide";
import { usePalette } from "@purrphect/ui/lib/theme";
import { cn } from "@purrphect/ui/lib/utils";
import { Meter } from "@purrphect/ui/meter";
import { Panel } from "@purrphect/ui/panel";
import { RankRow } from "@purrphect/ui/rank-row";
import { Text } from "@purrphect/ui/text";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useMemo } from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorSwatches } from "@/components/ColorSwatches";
import { DartBoard } from "@/components/DartBoard";
import { RateBars, TrendChart } from "@/components/StatCharts";
import { byId, deletePlayer, loadPlayersAndMatches, savesSettled, setPlayerColor } from "@/db/repo";
import { LEVELS, progressFor, XP_RULES } from "@/game/levels";
import { doubleRates, playerStats, rangeRates } from "@/game/stats";
import { replay, standings } from "@/game/x01";
import { useFocusData } from "@/hooks/useFocusData";
import { useT } from "@/i18n/LanguageProvider";
import { decimal, percent, relativeDay } from "@/lib/format";

export default function PlayerCard() {
  const db = useSQLiteContext();
  const wide = useWide();
  const palette = usePalette();
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, reload] = useFocusData(loadPlayersAndMatches);
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
            others.length === 1 ? (players.get(others[0] ?? "")?.name ?? "?") : t.playerCount(m.playerIds.length);
          const result =
            m.playerIds.length === 2
              ? `${state.legsWon[me] ?? 0} – ${state.legsWon[1 - me] ?? 0}`
              : t.ordinal(standings(state).indexOf(me) + 1);
          return { id: m.id, vs, when: relativeDay(t, m.finishedAt), start: m.rules.start, result };
        }),
    [matches, id, players, t],
  );

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <AppHeader title={t.player} back backLabel={t.back} />
        {data && <Text className="p-6 text-center text-muted-foreground">{t.card.gone}</Text>}
      </SafeAreaView>
    );
  }

  const remove = () =>
    Alert.alert(t.card.deleteTitle(player.name), t.card.deleteBody, [
      { text: t.keep, style: "cancel" },
      {
        text: t.card.delete,
        style: "destructive",
        onPress: async () => {
          await savesSettled();
          await deletePlayer(db, player.id);
          router.dismissTo("/");
        },
      },
    ]);

  const span = (progress.next?.xp ?? progress.xp) - progress.current.xp;
  const share = progress.next ? (progress.xp - progress.current.xp) / Math.max(1, span) : 1;

  const profile = (
    <View className="items-center gap-3 rounded-3xl bg-card p-5">
      <Cat size={96} color={player.color} />
      <ColorSwatches
        value={player.color}
        players={data?.players.filter((p) => p.id !== player.id) ?? []}
        onChange={(color) => setPlayerColor(db, player.id, color).then(reload, console.error)}
      />
      <Text className="font-nunito-black text-2xl">{player.name}</Text>
      <View className="rounded-full bg-butter-soft px-3 py-1">
        <Text className="font-nunito-black text-sm text-butter-ink">
          {t.level(progress.level)} · {t.levels[progress.current.key]}
        </Text>
      </View>
      <View className="w-full gap-1">
        <Meter value={share} />
        <Text className="text-center text-xs text-muted-foreground">
          {progress.next
            ? t.card.toNext(progress.xp, progress.next.xp, t.levels[progress.next.key])
            : t.card.topLevel(progress.xp)}
        </Text>
      </View>
      <View className="flex-row gap-6">
        {[
          [decimal(t, stats.average), t.card.avg],
          [percent(t, stats.checkoutRate), t.card.checkout],
          [String(stats.legsWon), t.card.legsWon],
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
                {t.badges[b]}
              </Text>
            </View>
          ))}
        </View>
      )}
      <Button variant="ghost" size="sm" onPress={remove}>
        <Text className="text-destructive">{t.card.deletePlayer}</Text>
      </Button>
    </View>
  );

  const levels = (
    <Panel title={t.card.levels} hint={`${progress.xp} XP`}>
      <View className="flex-row flex-wrap gap-1.5">
        {XP_RULES.map((r) => (
          <View key={r.key} className="flex-row gap-1 rounded-lg bg-background px-2 py-1">
            <Text className="text-[11px]">{t.xp[r.key]}</Text>
            <Text className="font-nunito-black text-[11px] text-pink-ink">+{r.xp}</Text>
          </View>
        ))}
      </View>
      {LEVELS.map((l, i) => {
        const reached = i + 1 <= progress.level;
        const current = i + 1 === progress.level;
        return (
          <RankRow
            key={l.key}
            rank={i + 1}
            color={reached ? player.color : palette.border}
            name={t.levels[l.key]}
            highlight={current}
            muted={!reached}
          >
            <Text className="text-xs text-muted-foreground">
              {current ? t.card.now : reached ? t.card.done : `${l.xp} XP`}
            </Text>
          </RankRow>
        );
      })}
    </Panel>
  );

  const game = (
    <View className="gap-4">
      <Panel title={t.card.whereYourDartsLand} hint={t.darts(stats.darts)} className="items-center">
        <DartBoard size={wide ? 320 : 300} heat={stats.heat} />
      </Panel>
      <Panel title={t.card.checkoutByRange} hint={t.card.finishableVisits}>
        <RateBars rows={rangeRates(stats)} />
        {doubleRates(stats, 1).map((d) => (
          <Text key={d.label} className="text-xs text-muted-foreground">
            {t.card.mostTriedDouble} <Text className="font-nunito-black text-xs">{d.label}</Text> · {percent(t, d.rate)}
          </Text>
        ))}
      </Panel>
      <Panel title={t.card.form} hint={t.card.averagePerMatch}>
        <TrendChart points={stats.trend.slice(-12)} height={120} />
      </Panel>
      <Panel title={t.card.recentMatches}>
        {recent.length === 0 && <Text className="text-sm text-muted-foreground">{t.card.noMatches}</Text>}
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
      <AppHeader title={player.name} back backLabel={t.back} />
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

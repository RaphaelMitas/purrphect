import { AppHeader } from "@purrphect/ui/app-header";
import { Cat } from "@purrphect/ui/cat";
import { useWide } from "@purrphect/ui/hooks/use-wide";
import { cn } from "@purrphect/ui/lib/utils";
import { Panel } from "@purrphect/ui/panel";
import { Segmented } from "@purrphect/ui/segmented";
import { Text } from "@purrphect/ui/text";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DartBoard } from "@/components/DartBoard";
import { ColumnBars, Kpi, RateBars, TrendChart } from "@/components/StatCharts";
import { loadPlayersAndMatches } from "@/db/repo";
import { DAY } from "@/game/levels";
import { doubleRates, playerStats } from "@/game/stats";
import { useFocusData } from "@/hooks/useFocusData";
import { useT } from "@/i18n/LanguageProvider";
import { decimal, percent } from "@/lib/format";

type Range = "7" | "30" | "all";

export default function Stats() {
  const wide = useWide();
  const t = useT();
  const [data] = useFocusData(loadPlayersAndMatches);
  const [range, setRange] = useState<Range>("30");
  const [chosen, setChosen] = useState<string | null>(null);

  const played = useMemo(() => {
    const ids = new Set(data?.matches.flatMap((m) => m.playerIds));
    return (data?.players ?? []).filter((p) => ids.has(p.id) && !p.guest);
  }, [data]);
  const player = played.find((p) => p.id === chosen) ?? played[0];

  const matches = useMemo(() => {
    const all = data?.matches ?? [];
    if (range === "all") return all;
    const since = Date.now() - Number(range) * DAY;
    return all.filter((m) => m.finishedAt >= since);
  }, [data, range]);

  const stats = useMemo(() => (player ? playerStats(matches, player.id) : null), [matches, player]);

  const body =
    !player || !stats ? (
      <View className="items-center gap-3 py-16">
        <Cat size={72} />
        <Text className="text-muted-foreground">{t.stats.empty}</Text>
      </View>
    ) : (
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-3">
          <Kpi label={t.stats.average} value={decimal(t, stats.average)} />
          <Kpi label={t.stats.first9} value={decimal(t, stats.first9Average)} />
          <Kpi label={t.stats.checkout} value={percent(t, stats.checkoutRate)} />
          <Kpi label={t.stats.oneEighties} value={String(stats.bands["180"])} />
          <Kpi label={t.stats.highFinish} value={String(stats.highestFinish || "–")} />
          <Kpi label={t.stats.bestLeg} value={String(stats.bestLegDarts ?? "–")} />
        </View>
        <View className={cn("gap-4", wide && "flex-row")}>
          <View className="flex-[3] gap-4">
            <Panel title={t.stats.averagePerMatch} hint={t.stats.trendHint}>
              <TrendChart points={stats.trend} />
            </Panel>
            <View className={cn("gap-4", wide && "flex-row")}>
              <Panel title={t.stats.visits} className="flex-1">
                <ColumnBars
                  data={[
                    { label: "60+", value: stats.bands["60+"] },
                    { label: "80+", value: stats.bands["80+"] },
                    { label: "100+", value: stats.bands["100+"] },
                    { label: "140+", value: stats.bands["140+"] },
                    { label: "180", value: stats.bands["180"], highlight: true },
                  ]}
                />
              </Panel>
              <Panel title={t.stats.doubleRate} hint={t.stats.dartsAtDouble} className="flex-1">
                {Object.keys(stats.doubles).length ? (
                  <RateBars rows={doubleRates(stats)} tone="mint" />
                ) : (
                  <Text className="text-sm text-muted-foreground">{t.stats.noDoubles}</Text>
                )}
              </Panel>
            </View>
          </View>
          <Panel title={t.stats.whereDartsLand} hint={t.darts(stats.darts)} className="flex-[2] items-center">
            <DartBoard size={wide ? 340 : 300} heat={stats.heat} />
          </Panel>
        </View>
        <Link href={`/player/${player.id}`} asChild>
          <Pressable className="items-center rounded-2xl bg-pink-soft py-3 active:opacity-70">
            <Text className="font-nunito-black text-pink-ink">{t.stats.openCard(player.name)}</Text>
          </Pressable>
        </Link>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader title={t.statistics} back backLabel={t.back} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-12">
        <View className={cn("gap-3", wide && "flex-row items-center")}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
            className={wide ? "flex-1" : "grow-0"}
          >
            {played.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setChosen(p.id)}
                className={cn(
                  "flex-row items-center gap-2 rounded-full border-2 px-3 py-1.5",
                  p.id === player?.id ? "bg-card" : "border-transparent bg-muted",
                )}
                style={p.id === player?.id ? { borderColor: p.color } : undefined}
              >
                <Cat size={18} color={p.color} blush={false} />
                <Text className="font-nunito-bold text-sm">{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View className={cn("flex-row", wide ? "w-72" : "")}>
            <Segmented
              className="flex-1"
              options={[
                { value: "7", label: t.stats.days(7) },
                { value: "30", label: t.stats.days(30) },
                { value: "all", label: t.stats.all },
              ]}
              value={range}
              onChange={setRange}
            />
          </View>
        </View>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

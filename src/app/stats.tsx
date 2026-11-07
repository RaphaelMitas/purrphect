import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { Cat } from "@/components/Cat";
import { DartBoard } from "@/components/DartBoard";
import { Panel } from "@/components/Panel";
import { Segmented } from "@/components/Segmented";
import { ColumnBars, Kpi, RateBars, TrendChart } from "@/components/StatCharts";
import { Text } from "@/components/ui/text";
import { loadPlayersAndMatches } from "@/db/repo";
import { DAY } from "@/game/levels";
import { doubleRates, playerStats } from "@/game/stats";
import { useFocusData } from "@/hooks/useFocusData";
import { useWide } from "@/hooks/useWide";
import { percent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "all", label: "All" },
] as const;
type Range = (typeof RANGES)[number]["value"];

export default function Stats() {
  const wide = useWide();
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
        <Text className="text-muted-foreground">Finish a match to see statistics.</Text>
      </View>
    ) : (
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-3">
          <Kpi label="3-dart avg" value={stats.average.toFixed(1)} />
          <Kpi label="First 9 avg" value={stats.first9Average.toFixed(1)} />
          <Kpi label="Checkout" value={percent(stats.checkoutRate)} />
          <Kpi label="180s" value={String(stats.bands["180"])} />
          <Kpi label="High finish" value={String(stats.highestFinish || "–")} />
          <Kpi label="Best leg" value={stats.bestLegDarts ? `${stats.bestLegDarts} darts` : "–"} />
        </View>
        <View className={cn("gap-4", wide && "flex-row")}>
          <View className="flex-[3] gap-4">
            <Panel title="Average per match" hint="pink 3-dart · mint first 9">
              <TrendChart points={stats.trend} />
            </Panel>
            <View className={cn("gap-4", wide && "flex-row")}>
              <Panel title="Visits" className="flex-1">
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
              <Panel title="Double hit rate" hint="darts at double" className="flex-1">
                {Object.keys(stats.doubles).length ? (
                  <RateBars rows={doubleRates(stats)} tone="mint" />
                ) : (
                  <Text className="text-sm text-muted-foreground">No double attempts yet.</Text>
                )}
              </Panel>
            </View>
          </View>
          <Panel title="Where darts land" hint={`${stats.darts} darts`} className="flex-[2] items-center">
            <DartBoard size={wide ? 340 : 300} heat={stats.heat} />
          </Panel>
        </View>
        <Link href={`/player/${player.id}`} asChild>
          <Pressable className="items-center rounded-2xl bg-pink-soft py-3 active:opacity-70">
            <Text className="font-nunito-black text-pink-ink">Open {player.name}'s player card</Text>
          </Pressable>
        </Link>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader title="Statistics" back />
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
            <Segmented className="flex-1" options={RANGES} value={range} onChange={setRange} />
          </View>
        </View>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

import { AppHeader } from "@purrphect/ui/app-header";
import { Button } from "@purrphect/ui/button";
import { Cat } from "@purrphect/ui/cat";
import { useWide } from "@purrphect/ui/hooks/use-wide";
import { Icon } from "@purrphect/ui/icon";
import { usePalette } from "@purrphect/ui/lib/theme";
import { cn } from "@purrphect/ui/lib/utils";
import { NameDialog } from "@purrphect/ui/name-dialog";
import { Panel } from "@purrphect/ui/panel";
import { Text } from "@purrphect/ui/text";
import { Link, router } from "expo-router";
import { type SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { BarChart3, Star } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  byId,
  deleteMatch,
  isRegular,
  latestOpenMatch,
  listSetups,
  loadPlayersAndMatches,
  type Player,
  renameSetup,
  type Setup,
  savesSettled,
  setFavorite,
} from "@/db/repo";
import { progressFor } from "@/game/levels";
import { playerStats } from "@/game/stats";
import { replay } from "@/game/x01";
import { useFocusData } from "@/hooks/useFocusData";
import { relativeDay, rulesSummary, setupName } from "@/lib/format";

async function loadHome(db: SQLiteDatabase) {
  const [{ players, matches }, setups, open] = await Promise.all([
    loadPlayersAndMatches(db),
    listSetups(db),
    latestOpenMatch(db),
  ]);
  return { players, setups, open, matches };
}

function Avatars({ ids, players }: { ids: string[]; players: Map<string, Player> }) {
  return (
    <View className="flex-row">
      {ids.slice(0, 8).map((id) => (
        <View key={id} className="-mr-1">
          <Cat size={18} color={players.get(id)?.color} blush={false} />
        </View>
      ))}
    </View>
  );
}

function StarButton({ setup, onToggle }: { setup: Setup; onToggle: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={setup.favorite ? "Remove favourite" : "Add favourite"}
      onPress={onToggle}
      hitSlop={10}
    >
      <Icon
        as={Star}
        className={cn("size-5", setup.favorite ? "text-butter" : "text-muted-foreground/60")}
        fill={setup.favorite ? palette.butter : "transparent"}
      />
    </Pressable>
  );
}

export default function Home() {
  const db = useSQLiteContext();
  const wide = useWide();
  const [data, reload] = useFocusData(loadHome);
  const [renaming, setRenaming] = useState<Setup | null>(null);
  const players = useMemo(() => byId(data?.players ?? []), [data?.players]);
  const regulars = useMemo(
    () =>
      (data?.players ?? [])
        .filter(isRegular)
        .map((p) => ({ player: p, progress: progressFor(playerStats(data?.matches ?? [], p.id)) })),
    [data],
  );

  const toggleFavorite = async (s: Setup) => {
    await setFavorite(db, s.id, !s.favorite);
    reload();
  };
  const load = (s: Setup) => router.push({ pathname: "/lobby", params: { setup: s.id } });

  const favourites = data?.setups.filter((s) => s.favorite) ?? [];
  const recents = data?.setups.slice(0, 8) ?? [];
  const open = data?.open;
  const openState = open ? replay(open.rules, open.playerIds.length, open.segments) : null;
  const openPlayer = open && openState ? players.get(open.playerIds[openState.current] ?? "") : undefined;
  const discard = (matchId: string) =>
    Alert.alert("Discard this match?", "Its darts won't count towards stats.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          await savesSettled();
          await deleteMatch(db, matchId);
          reload();
        },
      },
    ]);

  const play = (
    <View className="gap-3">
      {open && openState && (
        <Pressable
          onPress={() => router.push(`/match/${open.id}`)}
          className="flex-row items-center gap-3 rounded-3xl border-2 border-pink bg-card p-4 active:opacity-80"
        >
          <Cat size={40} color={openPlayer?.color} />
          <View className="flex-1">
            <Text className="font-nunito-black text-base">Continue match</Text>
            <Text className="text-xs text-muted-foreground">
              {rulesSummary(open.rules)} · {openPlayer?.name} on {openState.remaining[openState.current]}
            </Text>
          </View>
          <Button variant="ghost" size="sm" onPress={() => discard(open.id)}>
            <Text className="text-muted-foreground">Discard</Text>
          </Button>
          <Text className="font-nunito-black text-pink-ink">Resume</Text>
        </Pressable>
      )}
      <Button size="lg" className="h-16 rounded-3xl" onPress={() => router.push("/lobby")}>
        <Text className="text-xl">New game</Text>
      </Button>

      <Panel title="Favourites" hint={favourites.length > 0 ? "long press to name" : undefined}>
        {favourites.length === 0 ? (
          <Text className="text-sm text-muted-foreground">Star a recent setup to keep it here.</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {favourites.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => load(s)}
                onLongPress={() => setRenaming(s)}
                className="min-w-40 flex-1 gap-1 rounded-2xl bg-background p-3 active:opacity-80"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 font-nunito-black text-base" numberOfLines={1}>
                    {setupName(s, players)}
                  </Text>
                  <StarButton setup={s} onToggle={() => toggleFavorite(s)} />
                </View>
                <Text className="text-xs text-muted-foreground">{rulesSummary(s.rules)}</Text>
                <Avatars ids={s.playerIds} players={players} />
              </Pressable>
            ))}
          </View>
        )}
      </Panel>

      <Panel title="Recent" className="gap-1">
        {recents.length === 0 && <Text className="text-sm text-muted-foreground">Your games show up here.</Text>}
        {recents.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => load(s)}
            className="flex-row items-center gap-3 border-t border-border py-2.5 active:opacity-70"
          >
            <StarButton setup={s} onToggle={() => toggleFavorite(s)} />
            <View className="flex-1">
              <Text className="font-nunito-bold text-sm" numberOfLines={1}>
                {setupName(s, players)}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {rulesSummary(s.rules)}
              </Text>
            </View>
            <Avatars ids={s.playerIds} players={players} />
            <Text className="w-16 text-right text-xs text-muted-foreground">{relativeDay(s.lastUsedAt)}</Text>
          </Pressable>
        ))}
      </Panel>
    </View>
  );

  const people = (
    <Panel title="Players" className="gap-1">
      {regulars.length === 0 && (
        <Text className="text-sm text-muted-foreground">Add players when you start a game.</Text>
      )}
      {regulars.map(({ player: p, progress }) => (
        <Link key={p.id} href={`/player/${p.id}`} asChild>
          <Pressable className="flex-row items-center gap-3 border-t border-border py-2 active:opacity-70">
            <Cat size={30} color={p.color} />
            <View className="flex-1">
              <Text className="font-nunito-bold text-base">{p.name}</Text>
              <Text className="text-xs text-muted-foreground">
                Lv. {progress.level} · {progress.name}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">{progress.xp} XP</Text>
          </Pressable>
        </Link>
      ))}
    </Panel>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader
        title="Dart Purrphect"
        right={
          <Link href="/stats" asChild>
            <Button variant="ghost" size="icon" accessibilityLabel="Statistics" className="rounded-full">
              <Icon as={BarChart3} className="size-6 text-foreground" />
            </Button>
          </Link>
        }
      />
      <ScrollView contentContainerClassName="p-4 pb-12">
        {wide ? (
          <View className="flex-row gap-4">
            <View className="flex-[3]">{play}</View>
            <View className="flex-[2]">{people}</View>
          </View>
        ) : (
          <View className="gap-4">
            {play}
            {people}
          </View>
        )}
      </ScrollView>
      <NameDialog
        open={renaming !== null}
        title="Name this setup"
        initial={renaming?.name ?? ""}
        placeholder="Thursday crew"
        action="Save"
        optional
        onOpenChange={(o) => !o && setRenaming(null)}
        onSubmit={async (name) => {
          if (!renaming) return;
          await renameSetup(db, renaming.id, name);
          reload();
        }}
      />
    </SafeAreaView>
  );
}

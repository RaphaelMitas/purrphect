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
import { BarChart3, Settings, Star } from "lucide-react-native";
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
import { useT } from "@/i18n/LanguageProvider";
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
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={setup.favorite ? t.home.removeFavourite : t.home.addFavourite}
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
  const t = useT();
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
    Alert.alert(t.home.discardTitle, t.home.discardBody, [
      { text: t.keep, style: "cancel" },
      {
        text: t.home.discard,
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
            <Text className="font-nunito-black text-base">{t.home.continueMatch}</Text>
            <Text className="text-xs text-muted-foreground">
              {rulesSummary(t, open.rules)} ·{" "}
              {t.home.standingOn(openPlayer?.name ?? "", openState.remaining[openState.current] ?? 0)}
            </Text>
          </View>
          <Button variant="ghost" size="sm" onPress={() => discard(open.id)}>
            <Text className="text-muted-foreground">{t.home.discard}</Text>
          </Button>
          <Text className="font-nunito-black text-pink-ink">{t.home.resume}</Text>
        </Pressable>
      )}
      <Button size="lg" className="h-16 rounded-3xl" onPress={() => router.push("/lobby")}>
        <Text className="text-xl">{t.newGame}</Text>
      </Button>

      <Panel title={t.home.favourites} hint={favourites.length > 0 ? t.home.longPressToName : undefined}>
        {favourites.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{t.home.favouritesEmpty}</Text>
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
                <Text className="text-xs text-muted-foreground">{rulesSummary(t, s.rules)}</Text>
                <Avatars ids={s.playerIds} players={players} />
              </Pressable>
            ))}
          </View>
        )}
      </Panel>

      <Panel title={t.home.recent} className="gap-1">
        {recents.length === 0 && <Text className="text-sm text-muted-foreground">{t.home.recentEmpty}</Text>}
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
                {rulesSummary(t, s.rules)}
              </Text>
            </View>
            <Avatars ids={s.playerIds} players={players} />
            <Text className="w-16 text-right text-xs text-muted-foreground">{relativeDay(t, s.lastUsedAt)}</Text>
          </Pressable>
        ))}
      </Panel>
    </View>
  );

  const people = (
    <Panel title={t.players} className="gap-1">
      {regulars.length === 0 && <Text className="text-sm text-muted-foreground">{t.home.playersEmpty}</Text>}
      {regulars.map(({ player: p, progress }) => (
        <Link key={p.id} href={`/player/${p.id}`} asChild>
          <Pressable className="flex-row items-center gap-3 border-t border-border py-2 active:opacity-70">
            <Cat size={30} color={p.color} />
            <View className="flex-1">
              <Text className="font-nunito-bold text-base">{p.name}</Text>
              <Text className="text-xs text-muted-foreground">
                {t.level(progress.level)} · {t.levels[progress.current.key]}
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
          <>
            <Link href="/stats" asChild>
              <Button variant="ghost" size="icon" accessibilityLabel={t.statistics} className="rounded-full">
                <Icon as={BarChart3} className="size-6 text-foreground" />
              </Button>
            </Link>
            <Link href="/settings" asChild>
              <Button variant="ghost" size="icon" accessibilityLabel={t.settings} className="rounded-full">
                <Icon as={Settings} className="size-6 text-foreground" />
              </Button>
            </Link>
          </>
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
        title={t.home.nameSetup}
        initial={renaming?.name ?? ""}
        placeholder={t.home.setupPlaceholder}
        action={t.save}
        closeLabel={t.close}
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

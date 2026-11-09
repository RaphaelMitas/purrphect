import { AppHeader } from "@purrphect/ui/app-header";
import { Button } from "@purrphect/ui/button";
import { useLayoutSize } from "@purrphect/ui/hooks/use-layout-size";
import { useTablet, useWide } from "@purrphect/ui/hooks/use-wide";
import { Segmented } from "@purrphect/ui/segmented";
import { Text } from "@purrphect/ui/text";
import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DartBoard } from "@/components/DartBoard";
import { CatBubble } from "@/components/match/CatBubble";
import { EventToast } from "@/components/match/EventToast";
import { MatchOver } from "@/components/match/MatchOver";
import { ThrowerCard } from "@/components/match/ThrowerCard";
import { PlayerStrip, type QueueEntry, UpNextList } from "@/components/match/UpNext";
import { TilesPad } from "@/components/TilesPad";
import {
  byId,
  createMatch,
  getInputMode,
  getMatch,
  type InputMode,
  listPlayers,
  type Match,
  type Player,
  playerColor,
  saveDarts,
  savesSettled,
  setInputMode,
} from "@/db/repo";
import { visitCall } from "@/game/call";
import { bestRoute } from "@/game/checkout";
import { suggest } from "@/game/predict";
import type { Segment } from "@/game/segments";
import { type MatchEvent, matchAverage, replay, standings, upNext } from "@/game/x01";
import { useMatchSounds } from "@/hooks/useMatchSounds";
import type { Messages } from "@/i18n/en";
import { useT } from "@/i18n/LanguageProvider";
import { rulesSummary } from "@/lib/format";

function eventMessage(t: Messages, e: MatchEvent | null, players: Player[]): string | null {
  if (!e) return null;
  const name = players[e.player]?.name ?? "";
  if (e.kind === "bust") return t.match.bust(name);
  if (e.kind === "180") return t.match.oneEighty;
  if (e.kind === "checkout") return t.match.finishes(name, e.place);
  if (e.kind === "leg") return t.match.gameShot(name);
  return null;
}

function BoardArea({ children }: { children: (size: number) => ReactNode }) {
  const [{ width, height }, onLayout] = useLayoutSize();
  const size = Math.floor(Math.min(width, height));
  return (
    <View className="flex-1 items-center justify-center" onLayout={onLayout}>
      {size > 0 && children(size)}
    </View>
  );
}

export default function MatchScreen() {
  useKeepAwake();
  const db = useSQLiteContext();
  const wide = useWide();
  const tablet = useTablet();
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [known, setKnown] = useState<Map<string, Player>>(new Map());
  const [segments, setSegments] = useState<Segment[]>([]);
  const [mode, setMode] = useState<InputMode>("board");
  const [toast, setToast] = useState<{ message: string | null; stamp: number }>({ message: null, stamp: 0 });
  const [busy, setBusy] = useState(false);
  const sounds = useMatchSounds();

  useEffect(() => {
    let active = true;
    savesSettled()
      .then(() => Promise.all([getMatch(db, id), listPlayers(db), getInputMode(db)]))
      .then(([m, all, inputMode]) => {
        if (!active) return;
        if (!m) {
          router.replace("/");
          return;
        }
        setKnown(byId(all));
        setMatch(m);
        setSegments(m.segments);
        setMode(inputMode);
      })
      .catch((error: unknown) => {
        console.error(error);
        router.replace("/");
      });
    return () => {
      active = false;
    };
  }, [db, id]);

  const state = useMemo(
    () => (match ? replay(match.rules, match.playerIds.length, segments) : null),
    [match, segments],
  );
  const suggestion = useMemo(() => (state ? suggest(state) : null), [state]);
  const players = useMemo(
    () =>
      (match?.playerIds ?? []).map(
        (pid, i): Player =>
          known.get(pid) ?? { id: pid, name: t.player, color: playerColor(i), guest: true, deleted: false },
      ),
    [match, known, t.player],
  );

  if (!match || !state || !suggestion) return <SafeAreaView className="flex-1 bg-background" />;

  const persist = (next: Segment[]) => {
    setSegments(next);
    const after = replay(match.rules, match.playerIds.length, next);
    void saveDarts(db, match.id, next, after.winner !== null);
    return after;
  };
  const throwDart = (segment: Segment) => {
    if (state.winner !== null || busy) return;
    const after = persist([...segments, segment]);
    sounds.dart(visitCall(state, after));
    setToast((cur) => ({ message: eventMessage(t, after.lastEvent, players), stamp: cur.stamp + 1 }));
  };
  const undo = () => {
    if (!segments.length || busy) return;
    sounds.cancelCall();
    persist(segments.slice(0, -1));
  };
  const changeMode = (m: InputMode) => {
    setMode(m);
    void setInputMode(db, m);
  };
  const leave = () => {
    if (!busy) router.dismissTo("/");
  };
  const rematch = async () => {
    if (busy) return;
    setBusy(true);
    try {
      router.replace(`/match/${await createMatch(db, match.rules, match.playerIds)}`);
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  };

  const thrower = players[state.current];
  const queue: QueueEntry[] = upNext(state).flatMap((i) => {
    const player = players[i];
    const remaining = state.remaining[i] ?? 0;
    return player
      ? [{ player, remaining, average: matchAverage(state, i), out: bestRoute(remaining, 3, match.rules.out) }]
      : [];
  });
  const onFinish = queue.filter((q) => q.out);
  const finalStandings = standings(state).flatMap((i) => {
    const player = players[i];
    return player ? [{ player, legsWon: state.legsWon[i] ?? 0, average: matchAverage(state, i) }] : [];
  });

  const throwerCard = thrower && (
    <ThrowerCard
      player={thrower}
      remaining={suggestion.remaining}
      average={matchAverage(state, state.current)}
      visitScore={state.visitStart - suggestion.remaining}
      legsWon={state.legsWon[state.current] ?? 0}
      thrown={state.visit}
      plan={suggestion.plan}
      compact={!tablet}
    />
  );
  const bubble = <CatBubble suggestion={suggestion} onFinish={onFinish} compact={!tablet} />;
  const boardButtons = (
    <View className="flex-row gap-2">
      {[
        { label: t.miss, onPress: () => throwDart("Miss") },
        { label: t.undo, onPress: undo },
      ].map((b) => (
        <Button key={b.label} variant="secondary" className="h-12 flex-1 rounded-2xl" onPress={b.onPress}>
          <Text className="text-muted-foreground">{b.label}</Text>
        </Button>
      ))}
    </View>
  );
  const input =
    mode === "board" ? (
      <>
        <BoardArea>{(size) => <DartBoard size={size} plan={suggestion.plan} onDart={throwDart} />}</BoardArea>
        {boardButtons}
      </>
    ) : (
      <TilesPad plan={suggestion.plan} onDart={throwDart} onUndo={undo} />
    );

  const modes = [
    { value: "board", label: t.match.board },
    { value: "tiles", label: t.match.tiles },
  ] as const;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <AppHeader
        title={t.match.leg(state.leg + 1)}
        back
        backLabel={t.back}
        onBack={() => leave()}
        right={<Text className="text-xs text-muted-foreground">{rulesSummary(t, match.rules)}</Text>}
      />
      {wide ? (
        <View className="flex-1 flex-row">
          <View className="flex-[1.25] gap-3 border-r-2 border-border p-4">
            <Segmented options={modes} value={mode} onChange={changeMode} size="lg" />
            {input}
          </View>
          <View className="flex-1 gap-3 p-4">
            {throwerCard}
            {bubble}
            <UpNextList entries={queue} />
          </View>
        </View>
      ) : (
        <View className="flex-1 gap-2 px-3 pb-2 pt-2">
          {throwerCard}
          <PlayerStrip entries={queue} />
          {bubble}
          <View className="h-10 flex-row">
            <Segmented className="flex-1" options={modes} value={mode} onChange={changeMode} />
          </View>
          {input}
        </View>
      )}
      <EventToast message={toast.message} stamp={toast.stamp} />
      {state.winner !== null && (
        <MatchOver standings={finalStandings} busy={busy} onUndo={undo} onRematch={rematch} onHome={() => leave()} />
      )}
    </SafeAreaView>
  );
}

import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { DartBoard } from "@/components/DartBoard";
import { CatBubble } from "@/components/match/CatBubble";
import { EventToast } from "@/components/match/EventToast";
import { MatchOver } from "@/components/match/MatchOver";
import { ThrowerCard } from "@/components/match/ThrowerCard";
import { PlayerStrip, type QueueEntry, UpNextList } from "@/components/match/UpNext";
import { Segmented } from "@/components/Segmented";
import { TilesPad } from "@/components/TilesPad";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  createMatch,
  getInputMode,
  getMatch,
  type InputMode,
  listPlayers,
  type Match,
  PLAYER_COLORS,
  type Player,
  saveDarts,
  setInputMode,
} from "@/db/repo";
import { bestRoute } from "@/game/checkout";
import { suggest } from "@/game/predict";
import type { Segment } from "@/game/segments";
import { type MatchEvent, matchAverage, replay, upNext } from "@/game/x01";
import { useWide } from "@/hooks/useWide";
import { ordinal, rulesSummary } from "@/lib/format";

const MODES = [
  { value: "board", label: "Board" },
  { value: "tiles", label: "Tiles" },
] as const;

function eventMessage(e: MatchEvent | null, players: Player[]): string | null {
  if (!e) return null;
  const name = players[e.player]?.name ?? "";
  if (e.kind === "bust") return `Bust, ${name}!`;
  if (e.kind === "180") return "One hundred and eighty!";
  if (e.kind === "checkout") return `${name} finishes ${ordinal(e.place)}!`;
  if (e.kind === "leg") return `Game shot, ${name}!`;
  return null;
}

function BoardArea({ children }: { children: (size: number) => ReactNode }) {
  const [size, setSize] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(Math.floor(Math.min(width, height)));
  };
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [mode, setMode] = useState<InputMode>("board");
  const [toast, setToast] = useState<{ message: string | null; stamp: number }>({ message: null, stamp: 0 });
  const saving = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    void Promise.all([getMatch(db, id), listPlayers(db), getInputMode(db)]).then(([m, all, inputMode]) => {
      if (!active) return;
      if (!m) {
        router.replace("/");
        return;
      }
      const byId = new Map(all.map((p) => [p.id, p]));
      setPlayers(
        m.playerIds.map(
          (pid, i) =>
            byId.get(pid) ?? {
              id: pid,
              name: "Player",
              color: PLAYER_COLORS[i % PLAYER_COLORS.length] ?? "#FF6FA3",
              guest: true,
            },
        ),
      );
      setMatch(m);
      setSegments(m.segments);
      setMode(inputMode);
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

  if (!match || !state || !suggestion) return <SafeAreaView className="flex-1 bg-background" />;

  const persist = (next: Segment[]) => {
    setSegments(next);
    const after = replay(match.rules, match.playerIds.length, next);
    // saveDarts writes the whole list, so a failed save is repaired by the next one.
    saving.current = saving.current
      .then(() => saveDarts(db, match.id, next, after.winner !== null))
      .catch(console.error);
    return after;
  };
  const throwDart = (segment: Segment) => {
    if (state.winner !== null) return;
    const after = persist([...segments, segment]);
    setToast((t) => ({ message: eventMessage(after.lastEvent, players), stamp: t.stamp + 1 }));
  };
  const undo = () => {
    if (segments.length) persist(segments.slice(0, -1));
  };
  const changeMode = (m: InputMode) => {
    setMode(m);
    void setInputMode(db, m);
  };
  const rematch = async () => {
    await saving.current;
    const next = await createMatch(db, match.rules, match.playerIds);
    router.replace(`/match/${next}`);
  };

  const thrower = players[state.current];
  const remainingOf = (p: Player) => state.remaining[players.indexOf(p)] ?? 0;
  const queue: QueueEntry[] = upNext(state).flatMap((i) => {
    const player = players[i];
    const remaining = state.remaining[i] ?? 0;
    return player
      ? [{ player, remaining, average: matchAverage(state, i), out: bestRoute(remaining, 3, match.rules.out) }]
      : [];
  });
  const onFinish = queue.filter((q) => q.out).map((q) => q.player);
  const standings = players
    .map((player, i) => ({ player, legsWon: state.legsWon[i] ?? 0, average: matchAverage(state, i) }))
    .sort((a, b) => b.legsWon - a.legsWon || b.average - a.average);

  const throwerCard = thrower && (
    <ThrowerCard
      player={thrower}
      remaining={suggestion.remaining}
      average={matchAverage(state, state.current)}
      visitScore={state.visitStart - suggestion.remaining}
      legsWon={state.legsWon[state.current] ?? 0}
      thrown={state.visit}
      plan={suggestion.plan}
      compact={!wide}
    />
  );
  const bubble = <CatBubble suggestion={suggestion} onFinish={onFinish} remainingOf={remainingOf} compact={!wide} />;
  const boardButtons = (
    <View className="flex-row gap-2">
      {(["Miss", "Bounce out"] as const).map((label) => (
        <Button key={label} variant="secondary" className="h-12 flex-1 rounded-2xl" onPress={() => throwDart("Miss")}>
          <Text className="font-nunito-black text-muted-foreground">{label}</Text>
        </Button>
      ))}
      <Button variant="secondary" className="h-12 flex-1 rounded-2xl" onPress={undo}>
        <Text className="font-nunito-black text-muted-foreground">Undo</Text>
      </Button>
    </View>
  );
  const input =
    mode === "board" ? (
      <>
        <BoardArea>{(size) => <DartBoard size={size} plan={suggestion.plan} onDart={throwDart} />}</BoardArea>
        {boardButtons}
      </>
    ) : (
      <TilesPad direct={wide} plan={suggestion.plan} onDart={throwDart} onUndo={undo} />
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <AppHeader
        title={`Leg ${state.leg + 1}`}
        back
        right={<Text className="text-xs text-muted-foreground">{rulesSummary(match.rules)}</Text>}
      />
      {wide ? (
        <View className="flex-1 flex-row">
          <View className="flex-[1.25] gap-3 border-r-2 border-border p-4">
            <Segmented options={MODES} value={mode} onChange={changeMode} size="lg" />
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
            <Segmented options={MODES} value={mode} onChange={changeMode} />
          </View>
          {input}
        </View>
      )}
      <EventToast message={toast.message} stamp={toast.stamp} />
      {state.winner !== null && (
        <MatchOver standings={standings} onUndo={undo} onRematch={rematch} onHome={() => router.replace("/")} />
      )}
    </SafeAreaView>
  );
}

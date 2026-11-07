import { router, useLocalSearchParams } from "expo-router";
import { type SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { ChevronDown, ChevronUp, Plus, Shuffle, X } from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { Cat } from "@/components/Cat";
import { NameDialog } from "@/components/NameDialog";
import { Panel } from "@/components/Panel";
import { RankRow } from "@/components/RankRow";
import { Segmented } from "@/components/Segmented";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { addGuest, addPlayer, byId, createMatch, listPlayers, listSetups, type Player } from "@/db/repo";
import { DEFAULT_RULES, type FinishMode, type OutRule, type Rules } from "@/game/rules";
import { useFocusData } from "@/hooks/useFocusData";
import { useWide } from "@/hooks/useWide";
import { cn } from "@/lib/utils";

const START_OPTIONS = [
  { value: "301", label: "301" },
  { value: "501", label: "501" },
  { value: "701", label: "701" },
  { value: "custom", label: "Custom" },
] as const;
const OUT_OPTIONS = [
  { value: "double", label: "Double" },
  { value: "master", label: "Master" },
  { value: "straight", label: "Straight" },
] as const;
const LEG_OPTIONS = [
  { value: "1", label: "1" },
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "custom", label: "Custom" },
] as const;
const FINISH_OPTIONS = [
  { value: "leg", label: "Leg ends" },
  { value: "places", label: "Play out places" },
] as const;

type StartOption = (typeof START_OPTIONS)[number]["value"];
type LegOption = (typeof LEG_OPTIONS)[number]["value"];

const MAX_PLAYERS = 12;

function pick<T extends string>(options: readonly { value: T }[], value: number, fallback: T): [T, string] {
  const found = options.find((o) => o.value === String(value));
  return found ? [found.value, ""] : [fallback, String(value)];
}

async function loadLobby(db: SQLiteDatabase) {
  const [players, setups] = await Promise.all([listPlayers(db), listSetups(db)]);
  return { players, setups };
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="font-nunito-bold text-xs text-muted-foreground">{label}</Text>
      <View className="flex-row">{children}</View>
    </View>
  );
}

export default function Lobby() {
  const db = useSQLiteContext();
  const wide = useWide();
  const { setup: setupId } = useLocalSearchParams<{ setup?: string }>();
  const [data, reload] = useFocusData(loadLobby);
  const [selected, setSelected] = useState<string[]>([]);
  const [start, setStart] = useState<StartOption>("501");
  const [startCustom, setStartCustom] = useState("");
  const [out, setOut] = useState<OutRule>(DEFAULT_RULES.out);
  const [legs, setLegs] = useState<LegOption>("3");
  const [legsCustom, setLegsCustom] = useState("");
  const [finish, setFinish] = useState<FinishMode>(DEFAULT_RULES.finish);
  const [adding, setAdding] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);

  const players = useMemo(() => byId(data?.players ?? []), [data?.players]);

  useEffect(() => {
    if (preloaded || !data) return;
    setPreloaded(true);
    const setup = data.setups.find((s) => s.id === setupId);
    if (!setup) return;
    const [s, sc] = pick(START_OPTIONS, setup.rules.start, "custom");
    const [l, lc] = pick(LEG_OPTIONS, setup.rules.firstTo, "custom");
    setSelected(setup.playerIds.filter((id) => players.has(id)));
    setStart(s);
    setStartCustom(sc);
    setOut(setup.rules.out);
    setLegs(l);
    setLegsCustom(lc);
    setFinish(setup.rules.finish);
  }, [data, preloaded, setupId, players]);

  const startValue = start === "custom" ? Number(startCustom) : Number(start);
  const legsValue = legs === "custom" ? Number(legsCustom) : Number(legs);
  const startValid = Number.isInteger(startValue) && startValue >= 2 && startValue <= 9999;
  const legsValid = Number.isInteger(legsValue) && legsValue >= 1 && legsValue <= 99;
  const canStart = selected.length > 0 && startValid && legsValid;

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_PLAYERS ? [...cur, id] : cur,
    );
  const move = (index: number, by: -1 | 1) =>
    setSelected((cur) => {
      const next = [...cur];
      const [item] = next.splice(index, 1);
      if (item) next.splice(index + by, 0, item);
      return next;
    });
  const shuffle = () =>
    setSelected((cur) => {
      const next = [...cur];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j] ?? "", next[i] ?? ""];
      }
      return next;
    });

  const added = (player: Player) => {
    reload();
    toggle(player.id);
  };

  const begin = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    try {
      const rules: Rules = { start: startValue, out, firstTo: legsValue, finish };
      router.replace(`/match/${await createMatch(db, rules, selected)}`);
    } catch (error) {
      console.error(error);
      setStarting(false);
    }
  };
  const full = selected.length >= MAX_PLAYERS;

  const roster = (data?.players ?? []).filter((p) => !p.guest || selected.includes(p.id));

  const who = (
    <Panel title="Who's playing?" hint={`${selected.length} / ${MAX_PLAYERS}`}>
      <View className="flex-row flex-wrap gap-2">
        {roster.map((p) => {
          const index = selected.indexOf(p.id);
          return (
            <Pressable
              key={p.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: index >= 0 }}
              onPress={() => toggle(p.id)}
              className={cn(
                "w-20 items-center gap-1 rounded-2xl border-[3px] p-2",
                index >= 0 ? "bg-card" : "border-transparent bg-background",
              )}
              style={index >= 0 ? { borderColor: p.color } : undefined}
            >
              <View style={{ opacity: index >= 0 ? 1 : 0.45 }}>
                <Cat size={36} color={p.color} />
              </View>
              <Text className="font-nunito-bold text-xs" numberOfLines={1}>
                {p.name}
              </Text>
              {index >= 0 && (
                <View
                  className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: p.color }}
                >
                  <Text className="font-nunito-black text-[10px] text-white">{index + 1}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
        {[
          { label: "Player", tint: "text-pink", onPress: () => setAdding(true) },
          {
            label: "Guest",
            tint: "text-muted-foreground",
            onPress: () => {
              setAddingGuest(true);
              void addGuest(db)
                .then(added)
                .catch(console.error)
                .finally(() => setAddingGuest(false));
            },
          },
        ].map((b) => (
          <Pressable
            key={b.label}
            accessibilityRole="button"
            accessibilityLabel={`Add ${b.label.toLowerCase()}`}
            disabled={full || addingGuest}
            onPress={b.onPress}
            className={cn(
              "w-20 items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border p-2",
              full && "opacity-40",
            )}
          >
            <Icon as={Plus} className={cn("size-6", b.tint)} />
            <Text className="font-nunito-bold text-xs">{b.label}</Text>
          </Pressable>
        ))}
      </View>
    </Panel>
  );

  const order = (
    <Panel
      title="Order"
      className="gap-1"
      right={
        <Pressable onPress={shuffle} className="flex-row items-center gap-1 rounded-full bg-pink-soft px-3 py-1.5">
          <Icon as={Shuffle} className="size-3.5 text-pink-ink" />
          <Text className="font-nunito-black text-xs text-pink-ink">Shuffle</Text>
        </Pressable>
      }
    >
      {selected.length === 0 && <Text className="py-2 text-sm text-muted-foreground">Tap players to add them.</Text>}
      {selected.map((id, i) => {
        const p = players.get(id);
        if (!p) return null;
        return (
          <RankRow key={id} rank={i + 1} color={p.color} name={p.name}>
            <Pressable
              accessibilityLabel={`Move ${p.name} up`}
              disabled={i === 0}
              onPress={() => move(i, -1)}
              className="p-1.5"
            >
              <Icon as={ChevronUp} className={cn("size-5", i === 0 ? "text-muted-foreground/30" : "text-foreground")} />
            </Pressable>
            <Pressable
              accessibilityLabel={`Move ${p.name} down`}
              disabled={i === selected.length - 1}
              onPress={() => move(i, 1)}
              className="p-1.5"
            >
              <Icon
                as={ChevronDown}
                className={cn("size-5", i === selected.length - 1 ? "text-muted-foreground/30" : "text-foreground")}
              />
            </Pressable>
            <Pressable accessibilityLabel={`Remove ${p.name}`} onPress={() => toggle(id)} className="p-1.5">
              <Icon as={X} className="size-5 text-muted-foreground" />
            </Pressable>
          </RankRow>
        );
      })}
    </Panel>
  );

  const settings = (
    <Panel title="Rules">
      <SettingRow label="Start">
        <Segmented
          className="flex-1"
          options={START_OPTIONS}
          value={start}
          onChange={setStart}
          custom={{ value: "custom", text: startCustom, placeholder: "1001", onChangeText: setStartCustom }}
        />
      </SettingRow>
      <SettingRow label="Out">
        <Segmented className="flex-1" options={OUT_OPTIONS} value={out} onChange={setOut} />
      </SettingRow>
      <SettingRow label="First to (legs)">
        <Segmented
          className="flex-1"
          options={LEG_OPTIONS}
          value={legs}
          onChange={setLegs}
          custom={{ value: "custom", text: legsCustom, placeholder: "7", onChangeText: setLegsCustom }}
        />
      </SettingRow>
      <SettingRow label="Finish">
        <Segmented className="flex-1" options={FINISH_OPTIONS} value={finish} onChange={setFinish} />
      </SettingRow>
      {!startValid && <Text className="text-xs text-destructive">Start score between 2 and 9999.</Text>}
      {!legsValid && <Text className="text-xs text-destructive">First to between 1 and 99 legs.</Text>}
      <Button size="lg" className="mt-1 h-14 rounded-3xl" disabled={!canStart || starting} onPress={begin}>
        <Text className="text-lg">
          {selected.length ? `Start · ${selected.length} player${selected.length > 1 ? "s" : ""}` : "Pick players"}
        </Text>
      </Button>
    </Panel>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <AppHeader title="New game" back />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-12" keyboardShouldPersistTaps="handled">
        {wide ? (
          <View className="flex-row gap-4">
            <View className="flex-[3] gap-4">{who}</View>
            <View className="flex-[2] gap-4">
              {order}
              {settings}
            </View>
          </View>
        ) : (
          <>
            {who}
            {order}
            {settings}
          </>
        )}
      </ScrollView>
      <NameDialog
        open={adding}
        title="New player"
        placeholder="Name"
        action="Add"
        onOpenChange={setAdding}
        onSubmit={async (name) => added(await addPlayer(db, name))}
      />
    </SafeAreaView>
  );
}

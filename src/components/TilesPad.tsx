import * as Haptics from "expo-haptics";
import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { BOARD_NUMBERS, type BoardNumber, type Multiplier, type Segment, segmentFor } from "@/game/segments";
import { cn } from "@/lib/utils";

const ARMED = {
  1: { tile: "bg-card", text: "text-foreground" },
  2: { tile: "bg-mint-soft", text: "text-mint-ink" },
  3: { tile: "bg-pink-soft", text: "text-pink-ink" },
} as const;

function PlanBadge({ index, suffix }: { index: number; suffix?: string }) {
  return (
    <View className="absolute right-1 top-1 rounded-full bg-foreground px-1.5">
      <Text className="font-nunito-black text-[10px] text-background">
        {index + 1}
        {suffix ? ` · ${suffix}` : ""}
      </Text>
    </View>
  );
}

function Key({
  onPress,
  className,
  highlighted,
  children,
  label,
}: {
  onPress: () => void;
  className?: string;
  highlighted?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        "items-center justify-center active:opacity-70",
        highlighted && "border-[3px] border-foreground",
        className,
      )}
    >
      {children}
    </Pressable>
  );
}

export function TilesPad({
  direct,
  plan,
  onDart,
  onUndo,
}: {
  direct: boolean;
  plan: readonly Segment[];
  onDart: (segment: Segment) => void;
  onUndo: () => void;
}) {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const prefix = multiplier === 2 ? "D" : multiplier === 3 ? "T" : "";
  const armed = ARMED[multiplier];

  const hit = (segment: Segment) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMultiplier(1);
    onDart(segment);
  };
  const toggle = (m: Multiplier) => setMultiplier((cur) => (cur === m ? 1 : m));
  const planIndex = (segment: Segment) => plan.indexOf(segment);
  const numberPlan = (n: BoardNumber) =>
    plan.findIndex((s) => s === segmentFor(n, 1) || s === segmentFor(n, 2) || s === segmentFor(n, 3));

  const tile = (n: BoardNumber) => {
    const main = segmentFor(n, multiplier);
    if (direct) {
      const mainIndex = planIndex(main);
      return (
        <View key={n} className="flex-1 overflow-hidden rounded-2xl bg-card">
          <Key
            label={`${prefix}${n}`}
            onPress={() => hit(main)}
            highlighted={mainIndex >= 0}
            className={cn("flex-1 rounded-2xl", armed.tile)}
          >
            <Text className={cn("font-nunito-black text-2xl", armed.text)}>
              {prefix}
              {n}
            </Text>
            {mainIndex >= 0 && <PlanBadge index={mainIndex} />}
          </Key>
          <View className="flex-row">
            {([2, 3] as const).map((m) => {
              const s = segmentFor(n, m);
              const i = planIndex(s);
              return (
                <Key
                  key={m}
                  label={s}
                  onPress={() => hit(s)}
                  highlighted={i >= 0}
                  className={cn("flex-1 rounded-xl py-2", m === 2 ? "bg-mint-soft" : "bg-pink-soft")}
                >
                  <Text className={cn("font-nunito-black text-sm", m === 2 ? "text-mint-ink" : "text-pink-ink")}>
                    {m === 2 ? "D" : "T"}
                  </Text>
                  {i >= 0 && <PlanBadge index={i} />}
                </Key>
              );
            })}
          </View>
        </View>
      );
    }
    const i = numberPlan(n);
    const planned = plan[i];
    const suffix = planned?.startsWith("D") ? "D" : planned?.startsWith("T") ? "T" : undefined;
    return (
      <Key
        key={n}
        label={`${prefix}${n}`}
        onPress={() => hit(main)}
        highlighted={i >= 0}
        className={cn("flex-1 rounded-2xl", armed.tile)}
      >
        <Text className={cn("font-nunito-black text-xl", armed.text)}>
          {prefix}
          {n}
        </Text>
        {i >= 0 && <PlanBadge index={i} suffix={suffix} />}
      </Key>
    );
  };

  const rows = [0, 1, 2, 3].map((r) => BOARD_NUMBERS.slice(r * 5, r * 5 + 5));

  return (
    <View className="flex-1 gap-2">
      <View className="flex-row gap-2">
        {([2, 3] as const).map((m) => (
          <Key
            key={m}
            label={m === 2 ? "Double" : "Triple"}
            onPress={() => toggle(m)}
            className={cn("h-11 flex-1 rounded-full", multiplier === m ? (m === 2 ? "bg-mint" : "bg-pink") : "bg-card")}
          >
            <Text
              className={cn(
                "font-nunito-black text-base",
                multiplier === m ? "text-white" : m === 2 ? "text-mint-ink" : "text-pink-ink",
              )}
            >
              {m === 2 ? "Double" : "Triple"}
            </Text>
          </Key>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row[0]} className="flex-1 flex-row gap-2">
          {row.map(tile)}
        </View>
      ))}
      <View className="h-12 flex-row gap-2">
        {(["25", "Bull"] as const).map((s) => {
          const i = planIndex(s);
          return (
            <Key
              key={s}
              label={s}
              onPress={() => hit(s)}
              highlighted={i >= 0}
              className="flex-1 rounded-2xl bg-butter-soft"
            >
              <Text className="font-nunito-black text-base text-butter-ink">{s}</Text>
              {i >= 0 && <PlanBadge index={i} />}
            </Key>
          );
        })}
        <Key label="Miss" onPress={() => hit("Miss")} className="flex-1 rounded-2xl bg-muted">
          <Text className="font-nunito-bold text-base text-muted-foreground">Miss</Text>
        </Key>
        <Key label="Undo" onPress={onUndo} className="flex-1 rounded-2xl bg-muted">
          <Text className="font-nunito-bold text-base text-muted-foreground">Undo</Text>
        </Key>
      </View>
    </View>
  );
}

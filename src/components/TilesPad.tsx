import * as Haptics from "expo-haptics";
import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { planOrder } from "@/game/predict";
import {
  BOARD_NUMBERS,
  type BoardNumber,
  info,
  label,
  type Multiplier,
  type Segment,
  segmentFor,
  tone,
} from "@/game/segments";
import { cn } from "@/lib/utils";

const ARMED = {
  1: { tile: "bg-card", text: "text-foreground" },
  2: { tile: "bg-mint-soft", text: "text-mint-ink" },
  3: { tile: "bg-pink-soft", text: "text-pink-ink" },
} as const;

function Key({
  onPress,
  className,
  order,
  children,
  label,
}: {
  onPress: () => void;
  className?: string;
  order?: string;
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
        order && "border-[3px] border-foreground",
        className,
      )}
    >
      {children}
      {order && (
        <View className="absolute right-1 top-1 rounded-full bg-foreground px-1.5">
          <Text className="font-nunito-black text-[10px] text-background">{order}</Text>
        </View>
      )}
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
  const armed = ARMED[multiplier];

  const hit = (segment: Segment) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMultiplier(1);
    onDart(segment);
  };
  const toggle = (m: Multiplier) => setMultiplier((cur) => (cur === m ? 1 : m));
  const orderOf = (segment: Segment) => planOrder(plan, (s) => s === segment);

  const tile = (n: BoardNumber) => {
    const main = segmentFor(n, multiplier);
    if (direct) {
      return (
        <View key={n} className="flex-1 overflow-hidden rounded-2xl bg-card">
          <Key
            label={label(main)}
            onPress={() => hit(main)}
            order={orderOf(main)}
            className={cn("flex-[3] rounded-2xl", armed.tile)}
          >
            <Text className={cn("font-nunito-black text-2xl", armed.text)}>{label(main)}</Text>
          </Key>
          <View className="min-h-10 flex-[2] flex-row">
            {([2, 3] as const).map((m) => {
              const s = segmentFor(n, m);
              return (
                <Key
                  key={m}
                  label={s}
                  onPress={() => hit(s)}
                  order={orderOf(s)}
                  className={cn("flex-1 rounded-xl", ARMED[m].tile)}
                >
                  <Text className={cn("font-nunito-black text-sm", ARMED[m].text)}>{s[0]}</Text>
                </Key>
              );
            })}
          </View>
        </View>
      );
    }
    return (
      <Key
        key={n}
        label={label(main)}
        onPress={() => hit(main)}
        order={planOrder(
          plan,
          (s) => info(s).number === n,
          (s, i) => `${i}${tone(s) === "single" ? "" : s[0]}`,
        )}
        className={cn("flex-1 rounded-2xl", armed.tile)}
      >
        <Text className={cn("font-nunito-black text-xl", armed.text)}>{label(main)}</Text>
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
            <Text className={cn("font-nunito-black text-base", multiplier === m ? "text-white" : ARMED[m].text)}>
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
          return (
            <Key
              key={s}
              label={s}
              onPress={() => hit(s)}
              order={orderOf(s)}
              className="flex-1 rounded-2xl bg-butter-soft"
            >
              <Text className="font-nunito-black text-base text-butter-ink">{s}</Text>
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

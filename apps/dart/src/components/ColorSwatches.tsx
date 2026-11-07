import { cn } from "@purrphect/ui/lib/utils";
import { Pressable, View } from "react-native";
import { colorUses, PLAYER_COLORS, type Player } from "@/db/repo";

export function ColorSwatches({
  value,
  players,
  onChange,
}: {
  value: string;
  players: readonly Player[];
  onChange: (color: string) => void;
}) {
  return (
    <View className="max-w-72 flex-row flex-wrap justify-center gap-2 self-center">
      {PLAYER_COLORS.map((color, i) => {
        const selected = color === value;
        const inUse = colorUses(players, color) > 0;
        return (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`Colour ${i + 1}${inUse ? ", in use" : ""}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            className={cn(
              "size-9 items-center justify-center rounded-full border-[3px] active:opacity-70",
              selected ? "border-foreground" : "border-transparent",
            )}
            style={{ backgroundColor: color }}
          >
            {inUse && <View className="size-2 rounded-full bg-white" />}
          </Pressable>
        );
      })}
    </View>
  );
}

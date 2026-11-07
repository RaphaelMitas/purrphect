import { cn } from "@purrphect/ui/lib/utils";
import { Pressable, View } from "react-native";

export function ColorSwatches({
  colors,
  value,
  inUse,
  onChange,
}: {
  colors: readonly string[];
  value: string;
  inUse?: (color: string) => boolean;
  onChange: (color: string) => void;
}) {
  return (
    <View className="max-w-72 flex-row flex-wrap justify-center gap-2 self-center">
      {colors.map((color, i) => {
        const selected = color.toUpperCase() === value.toUpperCase();
        const used = inUse?.(color) ?? false;
        return (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`Colour ${i + 1}${used ? ", in use" : ""}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            className={cn(
              "size-9 items-center justify-center rounded-full border-[3px] active:opacity-70",
              selected ? "border-foreground" : "border-transparent",
            )}
            style={{ backgroundColor: color }}
          >
            {used && <View className="size-2 rounded-full bg-white" />}
          </Pressable>
        );
      })}
    </View>
  );
}

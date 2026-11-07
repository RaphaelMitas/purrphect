import { cn } from "@purrphect/ui/lib/utils";
import { Pressable, View } from "react-native";
import { useT } from "@/i18n/LanguageProvider";

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
  const t = useT();
  return (
    <View className="max-w-72 flex-row flex-wrap justify-center gap-2 self-center">
      {colors.map((color, i) => {
        const selected = color === value;
        const used = inUse?.(color) ?? false;
        return (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={t.card.colour(i + 1, used)}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            className={cn(
              "size-10 rounded-full border-2 p-0.5 active:opacity-70",
              selected ? "border-foreground" : "border-transparent",
            )}
          >
            <View
              className="flex-1 items-center justify-center rounded-full border border-border"
              style={{ backgroundColor: color }}
            >
              {used && <View className="size-2 rounded-full bg-white" />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

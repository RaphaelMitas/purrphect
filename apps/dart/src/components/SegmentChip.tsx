import { cn } from "@purrphect/ui/lib/utils";
import { Text } from "@purrphect/ui/text";
import { View } from "react-native";
import { label, type Segment, tone } from "@/game/segments";
import { useT } from "@/i18n/LanguageProvider";

const BOX = {
  treble: "bg-pink-soft border-pink/40",
  double: "bg-mint-soft border-mint/50",
  bull: "bg-butter-soft border-butter/60",
  single: "bg-card border-border",
  miss: "bg-muted border-border",
};

const INK = {
  treble: "text-pink-ink",
  double: "text-mint-ink",
  bull: "text-butter-ink",
  single: "text-foreground",
  miss: "text-muted-foreground",
};

const SIZE = {
  sm: ["h-7 min-w-9 rounded-lg px-1.5", "text-sm"],
  md: ["h-10 min-w-12 rounded-xl px-2.5", "text-lg"],
  lg: ["h-11 min-w-14 rounded-xl px-3", "text-xl"],
} as const;

export function SegmentChip({
  segment,
  size = "md",
  className,
}: {
  segment: Segment;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const t = useT();
  const kind = tone(segment);
  const [box, text] = SIZE[size];
  return (
    <View className={cn("items-center justify-center border-2", box, BOX[kind], className)}>
      <Text className={cn("font-nunito-black", text, INK[kind])}>{segment === "Miss" ? t.miss : label(segment)}</Text>
    </View>
  );
}

import type { ReactNode } from "react";
import { View } from "react-native";
import { Cat } from "./cat";
import { cn } from "./lib/utils";
import { Text } from "./text";

export function RankRow({
  rank,
  color,
  name,
  highlight,
  muted,
  children,
}: {
  rank: string | number;
  color: string;
  name: string;
  highlight?: boolean;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <View
      className={cn(
        "h-10 flex-row items-center gap-2 border-t border-border px-1",
        highlight && "rounded-xl border-transparent bg-butter-soft",
      )}
    >
      <Text className="w-5 text-center font-nunito-black text-[11px] text-muted-foreground">{rank}</Text>
      <Cat size={20} color={color} blush={false} />
      <Text className={cn("flex-1 font-nunito-bold text-sm", muted && "text-muted-foreground")} numberOfLines={1}>
        {name}
      </Text>
      {children}
    </View>
  );
}

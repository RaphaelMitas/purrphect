import type { ReactNode } from "react";
import { View } from "react-native";
import { cn } from "./lib/utils";
import { Text } from "./text";

export function Panel({
  title,
  hint,
  right,
  className,
  children,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <View className={cn("gap-3 rounded-3xl bg-card p-4", className)}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-nunito-black text-base">{title}</Text>
        {hint && <Text className="text-xs text-muted-foreground">{hint}</Text>}
        {right}
      </View>
      {children}
    </View>
  );
}

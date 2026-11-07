import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <View className={cn("gap-3 rounded-3xl bg-card p-4", className)}>
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="font-nunito-black text-base">{title}</Text>
        {hint && <Text className="text-xs text-muted-foreground">{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

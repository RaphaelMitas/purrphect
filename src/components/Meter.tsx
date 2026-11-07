import { View } from "react-native";
import { cn } from "@/lib/utils";

export function Meter({ value, className, fill = "bg-pink" }: { value: number; className?: string; fill?: string }) {
  return (
    <View className={cn("h-3 overflow-hidden rounded-full bg-muted", className)}>
      <View className={cn("h-full rounded-full", fill)} style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }} />
    </View>
  );
}

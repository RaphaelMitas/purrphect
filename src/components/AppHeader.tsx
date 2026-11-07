import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Cat } from "@/components/Cat";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export function AppHeader({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) {
  return (
    <View className="h-14 flex-row items-center gap-2 border-b-2 border-border px-4">
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          className="-ml-2 h-10 w-10 items-center justify-center rounded-full active:bg-muted"
        >
          <Icon as={ChevronLeft} className="size-6 text-foreground" />
        </Pressable>
      )}
      <Cat size={26} />
      <Text className="flex-1 font-nunito-black text-lg" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

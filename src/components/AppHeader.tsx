import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Cat } from "@/components/Cat";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export function AppHeader({
  title,
  back,
  onBack,
  right,
}: {
  title: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <View className="h-14 flex-row items-center gap-2 border-b-2 border-border px-4">
      {back && (
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Back"
          className="-ml-2 rounded-full"
          onPress={onBack ?? goBack}
        >
          <Icon as={ChevronLeft} className="size-6 text-foreground" />
        </Button>
      )}
      <Cat size={26} />
      <Text className="flex-1 font-nunito-black text-lg" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

import { Cat } from "@purrphect/ui/cat";
import { Text } from "@purrphect/ui/text";
import { useEffect, useState } from "react";
import { View } from "react-native";

export function EventToast({ message, stamp }: { message: string | null; stamp: number }) {
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (stamp === 0) return;
    setVisible(message);
    if (!message) return;
    const t = setTimeout(() => setVisible(null), 1800);
    return () => clearTimeout(t);
  }, [message, stamp]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" className="absolute left-0 right-0 top-20 items-center">
      <View className="flex-row items-center gap-2 rounded-full bg-foreground px-5 py-3">
        <Cat size={24} />
        <Text className="font-nunito-black text-lg text-background">{visible}</Text>
      </View>
    </View>
  );
}

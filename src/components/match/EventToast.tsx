import { useEffect, useState } from "react";
import { View } from "react-native";
import { Cat } from "@/components/Cat";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/lib/theme";

export function EventToast({ message, stamp }: { message: string | null; stamp: number }) {
  const palette = usePalette();
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (!message || stamp === 0) return;
    setVisible(message);
    const t = setTimeout(() => setVisible(null), 1800);
    return () => clearTimeout(t);
  }, [message, stamp]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" className="absolute left-0 right-0 top-20 items-center">
      <View className="flex-row items-center gap-2 rounded-full bg-foreground px-5 py-3">
        <Cat size={24} color={palette.pink} />
        <Text className="font-nunito-black text-lg text-background">{visible}</Text>
      </View>
    </View>
  );
}

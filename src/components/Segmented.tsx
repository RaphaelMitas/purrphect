import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface CustomField {
  text: string;
  placeholder: string;
  onChangeText: (text: string) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  custom,
  size = "md",
  className,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  custom?: CustomField & { value: T };
  size?: "md" | "lg";
  className?: string;
}) {
  const palette = usePalette();
  const [focusCustom, setFocusCustom] = useState(false);
  return (
    <View className={cn("flex-row rounded-full bg-muted p-1", className)}>
      {options.map((o) => {
        const selected = o.value === value;
        if (selected && custom && o.value === custom.value) {
          return (
            <View key={o.value} className="flex-1 rounded-full border-2 border-foreground bg-card px-2">
              <TextInput
                autoFocus={focusCustom}
                keyboardType="number-pad"
                maxLength={4}
                value={custom.text}
                placeholder={custom.placeholder}
                placeholderTextColor={palette.mutedForeground}
                onChangeText={(t) => custom.onChangeText(t.replace(/\D/g, ""))}
                className="py-1.5 text-center font-nunito-black text-sm text-foreground"
                accessibilityLabel={`Custom ${o.label}`}
              />
            </View>
          );
        }
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              setFocusCustom(o.value === custom?.value);
              onChange(o.value);
            }}
            className={cn(
              "flex-1 items-center justify-center rounded-full px-2",
              size === "lg" ? "py-2.5" : "py-2",
              selected && "bg-foreground",
            )}
          >
            <Text
              numberOfLines={1}
              className={cn(
                "font-nunito-bold",
                size === "lg" ? "text-base" : "text-sm",
                selected ? "text-background" : "text-muted-foreground",
              )}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

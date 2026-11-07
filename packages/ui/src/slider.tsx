import { useId, useState } from "react";
import { type GestureResponderEvent, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const TRACK = 16;
const THUMB = 28;

export function Slider({
  value,
  min,
  max,
  colors,
  label,
  valueText,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  colors: readonly string[];
  label: string;
  valueText?: string;
  onChange: (value: number) => void;
}) {
  const gradient = `slider${useId().replace(/\W/g, "")}`;
  const [width, setWidth] = useState(0);
  const span = max - min;
  const clampValue = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const track = (e: GestureResponderEvent) => {
    if (width <= THUMB) return;
    const ratio = (e.nativeEvent.locationX - THUMB / 2) / (width - THUMB);
    const next = clampValue(min + ratio * span);
    if (next !== value) onChange(next);
  };
  const left = width > THUMB ? ((clampValue(value) - min) / span) * (width - THUMB) : 0;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={valueText ? { text: valueText } : { min, max, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => onChange(clampValue(value + (e.nativeEvent.actionName === "increment" ? 1 : -1)))}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={track}
      onResponderMove={track}
      className="justify-center"
      style={{ height: THUMB }}
    >
      <View pointerEvents="none" className="overflow-hidden rounded-full" style={{ height: TRACK }}>
        <Svg width="100%" height={TRACK}>
          <Defs>
            <LinearGradient id={gradient} x1="0" y1="0" x2="1" y2="0">
              {colors.map((color, i) => (
                <Stop key={color + String(i)} offset={i / Math.max(1, colors.length - 1)} stopColor={color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width="100%" height={TRACK} fill={`url(#${gradient})`} />
        </Svg>
      </View>
      <View
        pointerEvents="none"
        className="absolute rounded-full border-[3px] border-foreground bg-card shadow-sm shadow-black/20"
        style={{ left, width: THUMB, height: THUMB }}
      />
    </View>
  );
}

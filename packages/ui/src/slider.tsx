import NativeSlider from "@callstack/slider";
import { createContext, useContext, useId } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const TRACK = 16;
const THUMB = 28;

// The slider renders track as <Track />, so an inline closure would remount it every render.
const Gradient = createContext<{ id: string; colors: readonly string[] }>({ id: "", colors: [] });

function GradientTrack() {
  const { id, colors } = useContext(Gradient);
  return (
    <View className="overflow-hidden rounded-full" style={{ height: TRACK }}>
      <Svg width="100%" height={TRACK}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            {colors.map((color, i) => (
              <Stop key={color + String(i)} offset={i / Math.max(1, colors.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={TRACK} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function Thumb() {
  return (
    <View
      className="rounded-full border-[3px] border-foreground bg-card shadow-sm shadow-black/20"
      style={{ width: THUMB, height: THUMB }}
    />
  );
}

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
  const id = `slider${useId().replace(/\W/g, "")}`;

  return (
    <Gradient.Provider value={{ id, colors }}>
      {/* The native thumb only announces an unlabeled percentage, so the host view is the element. */}
      <NativeSlider
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={valueText ? { text: valueText } : { min, max, now: value }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => {
          const step = e.nativeEvent.actionName === "increment" ? 1 : -1;
          const next = Math.min(max, Math.max(min, value + step));
          if (next !== value) onChange(next);
        }}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={1}
        onValueChange={onChange}
        track={GradientTrack}
        thumb={Thumb}
      />
    </Gradient.Provider>
  );
}

import { useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { Text } from "@/components/ui/text";
import type { TrendPoint } from "@/game/stats";
import { usePalette } from "@/lib/theme";
import { cn } from "@/lib/utils";

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  return [width, (e) => setWidth(e.nativeEvent.layout.width)];
}

export function TrendChart({ points, height = 170 }: { points: TrendPoint[]; height?: number }) {
  const palette = usePalette();
  const [width, onLayout] = useWidth();
  if (points.length < 2) {
    return <Text className="py-6 text-center text-sm text-muted-foreground">Play two matches to see a trend.</Text>;
  }
  const values = points.flatMap((p) => [p.average, p.first9Average]);
  const min = Math.floor(Math.min(...values) / 10) * 10;
  const max = Math.ceil(Math.max(...values) / 10) * 10 || 10;
  const x = (i: number) => 12 + (i * (width - 40)) / (points.length - 1);
  const y = (v: number) => height - 18 - ((v - min) / Math.max(1, max - min)) * (height - 30);
  const path = (pick: (p: TrendPoint) => number) =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(pick(p))}`).join("");
  const ticks = [min, (min + max) / 2, max];
  const last = points.at(-1);

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((t) => (
            <Line key={t} x1={12} x2={width - 28} y1={y(t)} y2={y(t)} stroke={palette.border} />
          ))}
          {ticks.map((t) => (
            <SvgText
              key={`l${t}`}
              x={width - 2}
              y={y(t) + 4}
              fontSize={10}
              fill={palette.mutedForeground}
              textAnchor="end"
            >
              {Math.round(t)}
            </SvgText>
          ))}
          <Path
            d={path((p) => p.first9Average)}
            stroke={palette.mint}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
          <Path d={path((p) => p.average)} stroke={palette.pink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          {last && <Circle cx={x(points.length - 1)} cy={y(last.average)} r={5} fill={palette.pink} />}
        </Svg>
      )}
    </View>
  );
}

export function ColumnBars({
  data,
  height = 140,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
}) {
  const palette = usePalette();
  const [width, onLayout] = useWidth();
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = width / Math.max(1, data.length);
  const bar = Math.min(44, slot * 0.6);
  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const h = (d.value / max) * (height - 44);
            const cx = slot * i + slot / 2;
            return (
              <SvgText
                key={`v${d.label}`}
                x={cx}
                y={height - 24 - h - 6}
                fontSize={12}
                fontFamily="Nunito_800ExtraBold"
                fill={palette.foreground}
                textAnchor="middle"
              >
                {d.value}
              </SvgText>
            );
          })}
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * (height - 44));
            const cx = slot * i + slot / 2;
            return (
              <Rect
                key={d.label}
                x={cx - bar / 2}
                y={height - 24 - h}
                width={bar}
                height={h}
                rx={8}
                fill={d.highlight ? palette.butter : palette.pink}
              />
            );
          })}
          {data.map((d, i) => (
            <SvgText
              key={`t${d.label}`}
              x={slot * i + slot / 2}
              y={height - 6}
              fontSize={11}
              fill={palette.mutedForeground}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}

export function RateBars({
  rows,
  tone = "pink",
}: {
  rows: { label: string; rate: number; detail?: string }[];
  tone?: "pink" | "mint";
}) {
  return (
    <View className="gap-2">
      {rows.map((r) => (
        <View key={r.label} className="flex-row items-center gap-2">
          <Text className="w-16 font-nunito-black text-xs">{r.label}</Text>
          <View className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <View
              className={cn("h-full rounded-full", tone === "mint" ? "bg-mint" : "bg-pink")}
              style={{ width: `${Math.round(r.rate * 100)}%` }}
            />
          </View>
          <Text className="w-20 text-right text-xs text-muted-foreground">
            {Math.round(r.rate * 100)}%{r.detail ? ` · ${r.detail}` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-32 flex-1 rounded-2xl bg-card px-3 py-2.5">
      <Text className="font-nunito-bold text-xs text-muted-foreground">{label}</Text>
      <Text className="font-nunito-black text-3xl">{value}</Text>
    </View>
  );
}

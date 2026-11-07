import { useLayoutSize } from "@purrphect/ui/hooks/use-layout-size";
import { usePalette } from "@purrphect/ui/lib/theme";
import { Meter } from "@purrphect/ui/meter";
import { Text } from "@purrphect/ui/text";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import type { TrendPoint } from "@/game/stats";
import { useT } from "@/i18n/LanguageProvider";
import { percent } from "@/lib/format";

export function TrendChart({ points, height = 170 }: { points: TrendPoint[]; height?: number }) {
  const palette = usePalette();
  const t = useT();
  const [{ width }, onLayout] = useLayoutSize();
  if (points.length < 2) {
    return <Text className="py-6 text-center text-sm text-muted-foreground">{t.stats.trendEmpty}</Text>;
  }
  const values = points.flatMap((p) => [p.average, p.first9Average]);
  const min = Math.floor(Math.min(...values) / 10) * 10;
  const max = Math.max(Math.ceil(Math.max(...values) / 10) * 10, min + 10);
  const x = (i: number) => 12 + (i * (width - 40)) / (points.length - 1);
  const y = (v: number) => height - 18 - ((v - min) / (max - min)) * (height - 30);
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
  const [{ width }, onLayout] = useLayoutSize();
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = width / Math.max(1, data.length);
  const bar = Math.min(44, slot * 0.6);
  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * (height - 44));
            const cx = slot * i + slot / 2;
            return (
              <G key={d.label}>
                <SvgText
                  x={cx}
                  y={height - 30 - h}
                  fontSize={12}
                  fontFamily="Nunito_800ExtraBold"
                  fill={palette.foreground}
                  textAnchor="middle"
                >
                  {d.value}
                </SvgText>
                <Rect
                  x={cx - bar / 2}
                  y={height - 24 - h}
                  width={bar}
                  height={h}
                  rx={8}
                  fill={d.highlight ? palette.butter : palette.pink}
                />
                <SvgText x={cx} y={height - 6} fontSize={11} fill={palette.mutedForeground} textAnchor="middle">
                  {d.label}
                </SvgText>
              </G>
            );
          })}
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
  const t = useT();
  return (
    <View className="gap-2">
      {rows.map((r) => (
        <View key={r.label} className="flex-row items-center gap-2">
          <Text className="w-16 font-nunito-black text-xs">{r.label}</Text>
          <Meter value={r.rate} className="flex-1" fill={tone === "mint" ? "bg-mint" : "bg-pink"} />
          <Text className="w-20 text-right text-xs text-muted-foreground">
            {percent(t, r.rate)}
            {r.detail ? ` · ${r.detail}` : ""}
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

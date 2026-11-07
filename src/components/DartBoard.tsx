import * as Haptics from "expo-haptics";
import { memo, useRef, useState } from "react";
import { type GestureResponderEvent, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { SegmentChip } from "@/components/SegmentChip";
import { Text } from "@/components/ui/text";
import { BOARD_RADIUS, hitTest, polar, RINGS, segmentCenter } from "@/game/board";
import { BOARD_ORDER, info, type Segment, segmentFor } from "@/game/segments";
import { type Palette, usePalette } from "@/lib/theme";

function arc(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

function segmentPaths(segment: Segment): string[] {
  const { number, multiplier } = info(segment);
  if (number === 0 || number === 25) return [];
  const i = BOARD_ORDER.indexOf(number);
  const a1 = i * 18 - 9;
  const a2 = i * 18 + 9;
  if (multiplier === 3) return [arc(RINGS.trebleIn, RINGS.trebleOut, a1, a2)];
  if (multiplier === 2) return [arc(RINGS.doubleIn, RINGS.doubleOut, a1, a2)];
  return [arc(RINGS.outerBull, RINGS.trebleIn, a1, a2), arc(RINGS.trebleOut, RINGS.doubleIn, a1, a2)];
}

type Heat = Partial<Record<Segment, number>>;

const Face = memo(function Face({ palette, plan, heat }: { palette: Palette; plan: readonly Segment[]; heat?: Heat }) {
  const max = heat ? Math.max(1, ...Object.values(heat)) : 1;
  const fill = (segment: Segment, base: string) =>
    heat ? `rgba(255,111,163,${(0.06 + ((heat[segment] ?? 0) / max) * 0.9).toFixed(2)})` : base;
  const stroke = (segment: Segment) => (plan.includes(segment) ? palette.foreground : palette.boardFace);
  const width = (segment: Segment) => (plan.includes(segment) ? 4 : 1.5);

  return (
    <G>
      <Circle r={BOARD_RADIUS - 2} fill={palette.boardFace} />
      {BOARD_ORDER.map((n, i) => {
        const odd = i % 2 === 1;
        const single = odd ? palette.boardSingleB : palette.boardSingleA;
        const ring = odd ? palette.mint : palette.pink;
        const parts: [Segment, string][] = [
          [segmentFor(n, 1), single],
          [segmentFor(n, 3), ring],
          [segmentFor(n, 2), ring],
        ];
        const [tx, ty] = polar(RINGS.numbers + 1, i * 18);
        return (
          <G key={n}>
            {parts.flatMap(([segment, color]) =>
              segmentPaths(segment).map((d) => (
                <Path key={d} d={d} fill={fill(segment, color)} stroke={stroke(segment)} strokeWidth={width(segment)} />
              )),
            )}
            <SvgText
              x={tx}
              y={ty + 7}
              fontSize={21}
              fontFamily="Nunito_800ExtraBold"
              fill={palette.foreground}
              textAnchor="middle"
            >
              {n}
            </SvgText>
          </G>
        );
      })}
      <Circle r={RINGS.outerBull} fill={fill("25", palette.mint)} stroke={stroke("25")} strokeWidth={width("25")} />
      <Circle r={RINGS.bull} fill={fill("Bull", palette.pink)} stroke={stroke("Bull")} strokeWidth={width("Bull")} />
      {plan.map((segment, i) => {
        const [x, y] = segmentCenter(segment);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: routes repeat segments (T20 T20 Bull), position is the identity
          <G key={i} transform={`translate(${x + 16 + i * 4} ${y - 16})`}>
            <Circle r={12} fill={palette.foreground} />
            <SvgText y={5} fontSize={14} fontFamily="Nunito_800ExtraBold" fill={palette.background} textAnchor="middle">
              {i + 1}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
});

interface Press {
  segment: Segment;
  x: number;
  y: number;
}

export function DartBoard({
  size,
  plan = [],
  heat,
  onDart,
}: {
  size: number;
  plan?: readonly Segment[];
  heat?: Heat;
  onDart?: (segment: Segment) => void;
}) {
  const palette = usePalette();
  const [press, setPress] = useState<Press | null>(null);
  const last = useRef<Segment | null>(null);
  const scale = (2 * BOARD_RADIUS) / size;

  const track = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const segment = hitTest(locationX * scale - BOARD_RADIUS, locationY * scale - BOARD_RADIUS);
    if (segment !== last.current) void Haptics.selectionAsync();
    last.current = segment;
    setPress({ segment, x: locationX, y: locationY });
  };

  const commit = () => {
    const segment = last.current;
    last.current = null;
    setPress(null);
    if (segment && onDart) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDart(segment);
    }
  };

  const cancel = () => {
    last.current = null;
    setPress(null);
  };

  return (
    <View
      style={{ width: size, height: size }}
      onStartShouldSetResponder={() => !!onDart}
      onMoveShouldSetResponder={() => !!onDart}
      onResponderTerminationRequest={() => false}
      onResponderGrant={track}
      onResponderMove={track}
      onResponderRelease={commit}
      onResponderTerminate={cancel}
    >
      <View pointerEvents="none">
        <Svg
          width={size}
          height={size}
          viewBox={`${-BOARD_RADIUS} ${-BOARD_RADIUS} ${BOARD_RADIUS * 2} ${BOARD_RADIUS * 2}`}
        >
          <Face palette={palette} plan={plan} heat={heat} />
          {press &&
            segmentPaths(press.segment).map((d) => (
              <Path key={d} d={d} fill={palette.butter} stroke={palette.foreground} strokeWidth={3} />
            ))}
          {press && (press.segment === "25" || press.segment === "Bull") && (
            <Circle
              r={press.segment === "Bull" ? RINGS.bull : RINGS.outerBull}
              fill={palette.butter}
              stroke={palette.foreground}
              strokeWidth={3}
            />
          )}
        </Svg>
      </View>
      {press && (
        <View
          pointerEvents="none"
          className="absolute flex-row items-center gap-2 rounded-2xl bg-foreground py-2 pl-2 pr-3"
          style={{ left: press.x - 60, top: press.y - 96 }}
        >
          <SegmentChip segment={press.segment} size="lg" />
          <Text className="font-nunito-black text-2xl text-background">{info(press.segment).value}</Text>
        </View>
      )}
    </View>
  );
}

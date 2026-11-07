import { type Palette, usePalette } from "@purrphect/ui/lib/theme";
import { Text } from "@purrphect/ui/text";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { memo, useRef, useState } from "react";
import { type GestureResponderEvent, View } from "react-native";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { SegmentChip } from "@/components/SegmentChip";
import { BOARD_RADIUS, hitTest, polar, RINGS, ringBands, SEGMENT_DEGREES, segmentCenter } from "@/game/board";
import { planOrder } from "@/game/predict";
import { BOARD_ORDER, info, type Segment, segmentFor } from "@/game/segments";

function arc(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

function SegmentShape({
  segment,
  fill,
  stroke,
  strokeWidth,
}: {
  segment: Segment;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  const { number, multiplier } = info(segment);
  if (number === 0 || multiplier === 0) return null;
  if (number === 25) {
    return (
      <Circle
        r={multiplier === 2 ? RINGS.bull : RINGS.outerBull}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  const i = BOARD_ORDER.indexOf(number);
  const a1 = i * SEGMENT_DEGREES - SEGMENT_DEGREES / 2;
  const a2 = a1 + SEGMENT_DEGREES;
  return ringBands(multiplier).map(([r1, r2]) => (
    <Path key={r1} d={arc(r1, r2, a1, a2)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ));
}

type Heat = Partial<Record<Segment, number>>;

const LOUPE_WIDTH = 130;
const NO_PLAN: readonly Segment[] = [];

// The board's own shades: in dark mode the singles must stand out from the page background.
const BOARD = {
  light: { face: "#FFFFFF", singleA: "#FFF7F2", singleB: "#FFE3EE" },
  dark: { face: "#241A1F", singleA: "#2E2228", singleB: "#44283A" },
};

const Face = memo(function Face({
  palette,
  board,
  plan,
  heat,
}: {
  palette: Palette;
  board: (typeof BOARD)["light"];
  plan: readonly Segment[];
  heat?: Heat;
}) {
  const max = Math.max(1, ...Object.entries(heat ?? {}).flatMap(([s, n]) => (s === "Miss" ? [] : [n])));
  const fill = (segment: Segment, base: string) =>
    heat
      ? `${palette.pink}${Math.round((0.06 + ((heat[segment] ?? 0) / max) * 0.9) * 255)
          .toString(16)
          .padStart(2, "0")}`
      : base;
  const stroke = (segment: Segment) => (plan.includes(segment) ? palette.foreground : board.face);
  const width = (segment: Segment) => (plan.includes(segment) ? 4 : 1.5);

  return (
    <G>
      <Circle r={BOARD_RADIUS - 2} fill={board.face} />
      {BOARD_ORDER.map((n, i) => {
        const odd = i % 2 === 1;
        const single = odd ? board.singleB : board.singleA;
        const ring = odd ? palette.mint : palette.pink;
        const parts: [Segment, string][] = [
          [segmentFor(n, 1), single],
          [segmentFor(n, 3), ring],
          [segmentFor(n, 2), ring],
        ];
        const [tx, ty] = polar(RINGS.numbers + 1, i * SEGMENT_DEGREES);
        return (
          <G key={n}>
            {parts.map(([segment, color]) => (
              <SegmentShape
                key={segment}
                segment={segment}
                fill={fill(segment, color)}
                stroke={stroke(segment)}
                strokeWidth={width(segment)}
              />
            ))}
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
      {(["25", "Bull"] as const).map((segment) => (
        <SegmentShape
          key={segment}
          segment={segment}
          fill={fill(segment, segment === "Bull" ? palette.pink : palette.mint)}
          stroke={stroke(segment)}
          strokeWidth={width(segment)}
        />
      ))}
      {[...new Set(plan)].map((segment) => {
        const [x, y] = segmentCenter(segment);
        const order = planOrder(plan, (s) => s === segment);
        const width = 12 + order.length * 7;
        return (
          <G key={segment} transform={`translate(${x + 14} ${y - 16})`}>
            <Rect x={-width / 2} y={-12} width={width} height={24} rx={12} fill={palette.foreground} />
            <SvgText y={5} fontSize={14} fontFamily="Nunito_800ExtraBold" fill={palette.background} textAnchor="middle">
              {order}
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
  plan = NO_PLAN,
  heat,
  onDart,
}: {
  size: number;
  plan?: readonly Segment[];
  heat?: Heat;
  onDart?: (segment: Segment) => void;
}) {
  const palette = usePalette();
  const { colorScheme } = useColorScheme();
  const [press, setPress] = useState<Press | null>(null);
  const last = useRef<Segment | null>(null);
  const scale = (2 * BOARD_RADIUS) / size;

  const track = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const hit = hitTest(locationX * scale - BOARD_RADIUS, locationY * scale - BOARD_RADIUS);
    const segment = hit === "Miss" ? null : hit;
    if (segment && segment !== last.current) void Haptics.selectionAsync();
    last.current = segment;
    setPress(segment ? { segment, x: locationX, y: locationY } : null);
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
          <Face palette={palette} board={BOARD[colorScheme === "dark" ? "dark" : "light"]} plan={plan} heat={heat} />
          {press && (
            <SegmentShape segment={press.segment} fill={palette.butter} stroke={palette.foreground} strokeWidth={3} />
          )}
        </Svg>
      </View>
      {press && (
        <View
          pointerEvents="none"
          className="absolute flex-row items-center gap-2 rounded-2xl bg-foreground py-2 pl-2 pr-3"
          style={{
            left: Math.min(Math.max(press.x - 60, 0), size - LOUPE_WIDTH),
            top: press.y < 110 ? press.y + 40 : press.y - 96,
          }}
        >
          <SegmentChip segment={press.segment} size="lg" />
          <Text className="font-nunito-black text-2xl text-background">{info(press.segment).value}</Text>
        </View>
      )}
    </View>
  );
}

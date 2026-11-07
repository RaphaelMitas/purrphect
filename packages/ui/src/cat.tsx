import { memo } from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { CHEEKS_X, EYES_X, HEAD, HEAD_TRANSFORM, NOSE, VIEW_BOX, WHISKER_SIDES, WHISKERS } from "./cat-paths";
import { usePalette } from "./lib/theme";

function Whiskers({ color }: { color: string }) {
  return WHISKERS.map((w) => <Path key={w.d} d={w.d} transform={w.transform} fill={color} />);
}

function Eye({ x, color, detail }: { x: number; color: string; detail: string }) {
  return (
    <G transform={`translate(${x}, 79.4965)`}>
      <Ellipse cx={14.5} cy={13.5} rx={14.5} ry={13.5} fill={detail} />
      <Circle cx={18.5} cy={12.5} r={3.5} fill={color} />
    </G>
  );
}

export const Cat = memo(function Cat({
  size = 32,
  color,
  blush = true,
}: {
  size?: number;
  color?: string;
  blush?: boolean;
}) {
  const palette = usePalette();
  const fill = color ?? palette.pink;
  return (
    <Svg width={size} height={(size * 255) / 229} viewBox={VIEW_BOX}>
      {WHISKER_SIDES.map((transform) => (
        <G key={transform} transform={transform}>
          <Whiskers color={fill} />
        </G>
      ))}
      <Path d={HEAD} fill={fill} transform={HEAD_TRANSFORM} />
      {blush &&
        CHEEKS_X.map((cx) => <Ellipse key={cx} cx={cx} cy={122} rx={12} ry={7} fill={palette.blush} opacity={0.8} />)}
      {EYES_X.map((x) => (
        <Eye key={x} x={x} color={fill} detail={palette.catDetail} />
      ))}
      <Path d={NOSE} fill={palette.catDetail} />
    </Svg>
  );
});

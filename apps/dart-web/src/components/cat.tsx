import {
  CHEEKS_X,
  EYES_X,
  HEAD,
  HEAD_TRANSFORM,
  NOSE,
  VIEW_BOX,
  WHISKER_SIDES,
  WHISKERS,
} from "@purrphect/ui/cat-paths";
import tokens from "@purrphect/ui/tokens";

const PINK = `hsl(${tokens.light.pink})`;
const DETAIL = `hsl(${tokens.light["primary-foreground"]})`;

export function Cat({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 255) / 229}
      viewBox={VIEW_BOX}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {WHISKER_SIDES.map((side) => (
        <g key={side} transform={side} fill={PINK}>
          {WHISKERS.map((w) => (
            <path key={w.d} d={w.d} transform={w.transform} />
          ))}
        </g>
      ))}
      <path d={HEAD} transform={HEAD_TRANSFORM} fill={PINK} />
      {CHEEKS_X.map((cx) => (
        <ellipse key={cx} cx={cx} cy={122} rx={12} ry={7} fill={DETAIL} opacity={0.4} />
      ))}
      {EYES_X.map((x) => (
        <g key={x} transform={`translate(${x}, 79.4965)`}>
          <ellipse cx={14.5} cy={13.5} rx={14.5} ry={13.5} fill={DETAIL} />
          <circle cx={18.5} cy={12.5} r={3.5} fill={PINK} />
        </g>
      ))}
      <path d={NOSE} fill={DETAIL} />
    </svg>
  );
}

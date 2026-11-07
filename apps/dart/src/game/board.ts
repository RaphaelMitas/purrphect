import { BOARD_ORDER, info, type Segment, segmentFor } from "./segments";

// Rings are widened against a real board so treble and double are big enough for a finger.
export const RINGS = {
  bull: 14,
  outerBull: 30,
  trebleIn: 100,
  trebleOut: 130,
  doubleIn: 170,
  doubleOut: 200,
  numbers: 220,
};
export const BOARD_RADIUS = 232;
export const SEGMENT_DEGREES = 18;

export function polar(radius: number, degrees: number): [number, number] {
  const t = (degrees * Math.PI) / 180;
  return [radius * Math.sin(t), -radius * Math.cos(t)];
}

export function hitTest(x: number, y: number): Segment {
  const r = Math.hypot(x, y);
  if (r <= RINGS.bull) return "Bull";
  if (r <= RINGS.outerBull) return "25";
  if (r > RINGS.doubleOut) return "Miss";
  const angle = ((Math.atan2(x, -y) * 180) / Math.PI + 360 + SEGMENT_DEGREES / 2) % 360;
  const number = BOARD_ORDER[Math.floor(angle / SEGMENT_DEGREES)] ?? 20;
  if (r > RINGS.doubleIn) return segmentFor(number, 2);
  if (r > RINGS.trebleIn && r <= RINGS.trebleOut) return segmentFor(number, 3);
  return segmentFor(number, 1);
}

export function ringBands(multiplier: 1 | 2 | 3): [number, number][] {
  if (multiplier === 3) return [[RINGS.trebleIn, RINGS.trebleOut]];
  if (multiplier === 2) return [[RINGS.doubleIn, RINGS.doubleOut]];
  return [
    [RINGS.outerBull, RINGS.trebleIn],
    [RINGS.trebleOut, RINGS.doubleIn],
  ];
}

export function segmentCenter(segment: Segment): [number, number] {
  const { number, multiplier } = info(segment);
  if (number === 0 || segment === "Bull") return [0, 0];
  if (number === 25) return [0, -(RINGS.bull + RINGS.outerBull) / 2];
  if (multiplier === 0) return [0, 0];
  const [inner, outer] = ringBands(multiplier).at(-1) ?? [0, 0];
  return polar((inner + outer) / 2, BOARD_ORDER.indexOf(number) * SEGMENT_DEGREES);
}

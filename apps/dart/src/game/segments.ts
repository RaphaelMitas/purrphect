export const BOARD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
export type BoardNumber = (typeof BOARD_NUMBERS)[number];

export const BOARD_ORDER: readonly BoardNumber[] = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

export type Multiplier = 1 | 2 | 3;
export type Segment = `S${BoardNumber}` | `D${BoardNumber}` | `T${BoardNumber}` | "25" | "Bull" | "Miss";

export interface SegmentInfo {
  segment: Segment;
  value: number;
  number: BoardNumber | 25 | 0;
  multiplier: 0 | Multiplier;
}

const PREFIX = { 1: "S", 2: "D", 3: "T" } as const;

export function segmentFor(number: BoardNumber, multiplier: Multiplier): Segment {
  return `${PREFIX[multiplier]}${number}`;
}

const all: SegmentInfo[] = BOARD_NUMBERS.flatMap((n) =>
  ([1, 2, 3] as const).map((m) => ({ segment: segmentFor(n, m), value: n * m, number: n, multiplier: m })),
);
all.push({ segment: "25", value: 25, number: 25, multiplier: 1 });
all.push({ segment: "Bull", value: 50, number: 25, multiplier: 2 });

export const SCORING_SEGMENTS: readonly SegmentInfo[] = all;
const MISS: SegmentInfo = { segment: "Miss", value: 0, number: 0, multiplier: 0 };

const BY_SEGMENT = new Map<string, SegmentInfo>([...all, MISS].map((s) => [s.segment, s]));

export function isSegment(value: string): value is Segment {
  return BY_SEGMENT.has(value);
}

export function info(segment: Segment): SegmentInfo {
  const found = BY_SEGMENT.get(segment);
  if (!found) throw new Error(`Unknown segment ${segment}`);
  return found;
}

export function label(segment: Segment): string {
  return segment.startsWith("S") ? segment.slice(1) : segment;
}

export type SegmentTone = "treble" | "double" | "bull" | "single" | "miss";

export function tone(segment: Segment): SegmentTone {
  if (segment === "Miss") return "miss";
  if (segment === "25" || segment === "Bull") return "bull";
  if (segment.startsWith("T")) return "treble";
  if (segment.startsWith("D")) return "double";
  return "single";
}

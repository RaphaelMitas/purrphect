import { isOneDartFinish } from "./checkout";
import { isBust, type Rules } from "./rules";
import { info, type Segment } from "./segments";

export interface DartRecord {
  player: number;
  leg: number;
  segment: Segment;
  scoreBefore: number;
  atFinish: boolean;
}

export interface VisitRecord {
  player: number;
  leg: number;
  darts: Segment[];
  scoreBefore: number;
  scored: number;
  bust: boolean;
  checkout: boolean;
}

export interface LegResult {
  order: number[];
  starter: number;
}

export type MatchEvent =
  | { kind: "bust"; player: number }
  | { kind: "180"; player: number }
  | { kind: "checkout"; player: number; place: number }
  | { kind: "leg"; player: number }
  | { kind: "match"; player: number };

export interface MatchState {
  rules: Rules;
  playerCount: number;
  leg: number;
  legStarter: number;
  current: number;
  visit: Segment[];
  visitStart: number;
  remaining: number[];
  legsWon: number[];
  finishedThisLeg: number[];
  legs: LegResult[];
  winner: number | null;
  darts: DartRecord[];
  visits: VisitRecord[];
  lastEvent: MatchEvent | null;
}

export function initialState(rules: Rules, playerCount: number): MatchState {
  return {
    rules,
    playerCount,
    leg: 0,
    legStarter: 0,
    current: 0,
    visit: [],
    visitStart: rules.start,
    remaining: Array.from({ length: playerCount }, () => rules.start),
    legsWon: Array.from({ length: playerCount }, () => 0),
    finishedThisLeg: [],
    legs: [],
    winner: null,
    darts: [],
    visits: [],
    lastEvent: null,
  };
}

function nextActive(s: MatchState, from: number): number {
  for (let step = 1; step <= s.playerCount; step++) {
    const p = (from + step) % s.playerCount;
    if (!s.finishedThisLeg.includes(p)) return p;
  }
  return from;
}

function startVisit(s: MatchState, player: number) {
  s.current = player;
  s.visit = [];
  s.visitStart = s.remaining[player] ?? s.rules.start;
}

function closeVisit(s: MatchState, scored: number, bust: boolean, checkout: boolean) {
  s.visits.push({
    player: s.current,
    leg: s.leg,
    darts: s.visit,
    scoreBefore: s.visitStart,
    scored,
    bust,
    checkout,
  });
}

function endLeg(s: MatchState) {
  const unplaced = Array.from({ length: s.playerCount }, (_, p) => p).filter((p) => !s.finishedThisLeg.includes(p));
  const order = [...s.finishedThisLeg, ...unplaced];
  const winner = order[0] ?? 0;
  s.legs.push({ order, starter: s.legStarter });
  s.legsWon[winner] = (s.legsWon[winner] ?? 0) + 1;
  if ((s.legsWon[winner] ?? 0) >= s.rules.firstTo) {
    s.winner = winner;
    s.lastEvent = { kind: "match", player: winner };
    s.visit = [];
    return;
  }
  s.lastEvent = { kind: "leg", player: winner };
  s.leg += 1;
  s.legStarter = (s.legStarter + 1) % s.playerCount;
  s.remaining = s.remaining.map(() => s.rules.start);
  s.finishedThisLeg = [];
  startVisit(s, s.legStarter);
}

function step(s: MatchState, segment: Segment) {
  if (s.winner !== null) return;
  const dart = info(segment);
  const player = s.current;
  const before = s.remaining[player] ?? s.rules.start;
  s.visit = [...s.visit, segment];
  s.darts.push({ player, leg: s.leg, segment, scoreBefore: before, atFinish: isOneDartFinish(before, s.rules.out) });
  s.lastEvent = null;
  const after = before - dart.value;

  if (isBust(after, dart, s.rules.out)) {
    s.remaining[player] = s.visitStart;
    closeVisit(s, 0, true, false);
    s.lastEvent = { kind: "bust", player };
    startVisit(s, nextActive(s, player));
    return;
  }

  s.remaining[player] = after;

  if (after === 0) {
    closeVisit(s, s.visitStart, false, true);
    s.finishedThisLeg.push(player);
    s.lastEvent = { kind: "checkout", player, place: s.finishedThisLeg.length };
    const stillPlaying = s.playerCount - s.finishedThisLeg.length;
    if (s.rules.finish === "leg" || stillPlaying <= 1) {
      endLeg(s);
      return;
    }
    startVisit(s, nextActive(s, player));
    return;
  }

  if (s.visit.length === 3) {
    const scored = s.visitStart - after;
    closeVisit(s, scored, false, false);
    if (scored === 180) s.lastEvent = { kind: "180", player };
    startVisit(s, nextActive(s, player));
  }
}

export function replay(rules: Rules, playerCount: number, segments: readonly Segment[]): MatchState {
  const s = initialState(rules, playerCount);
  for (const segment of segments) step(s, segment);
  return s;
}

export function upNext(s: MatchState): number[] {
  const order: number[] = [];
  let p = s.current;
  for (let i = 0; i < s.playerCount; i++) {
    p = nextActive(s, p);
    if (p === s.current || order.includes(p)) break;
    order.push(p);
  }
  return order;
}

export function threeDartAverage(points: number, darts: number): number {
  return darts ? (points / darts) * 3 : 0;
}

export function matchAverage(s: MatchState, player: number): number {
  let points = 0;
  let darts = 0;
  for (const v of s.visits) {
    if (v.player !== player) continue;
    points += v.scored;
    darts += v.darts.length;
  }
  return threeDartAverage(points, darts);
}

export function standings(s: MatchState): number[] {
  return Array.from({ length: s.playerCount }, (_, p) => p).sort(
    (a, b) => (s.legsWon[b] ?? 0) - (s.legsWon[a] ?? 0) || matchAverage(s, b) - matchAverage(s, a),
  );
}

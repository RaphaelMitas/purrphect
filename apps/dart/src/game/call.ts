import type { MatchState } from "./x01";

export type Call = number | "noScore" | "gameShot" | "matchShot";

export function visitCall(before: MatchState, after: MatchState): Call | null {
  const visit = after.visits.at(-1);
  if (!visit || after.visits.length === before.visits.length) return null;
  if (visit.checkout) {
    const winsLeg = before.finishedThisLeg.length === 0;
    const legsWon = (before.legsWon[visit.player] ?? 0) + 1;
    return winsLeg && legsWon >= before.rules.firstTo ? "matchShot" : "gameShot";
  }
  if (visit.bust || visit.scored === 0) return "noScore";
  return visit.scored;
}

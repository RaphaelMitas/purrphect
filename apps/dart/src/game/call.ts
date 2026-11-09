import type { MatchState } from "./x01";

export type Call = number | "noScore";

export function visitCall(before: MatchState, after: MatchState): Call | null {
  const visit = after.visits.at(-1);
  if (!visit || after.visits.length === before.visits.length) return null;
  if (visit.bust || visit.scored === 0) return "noScore";
  return visit.scored;
}

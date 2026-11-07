import type { Player, Setup } from "@/db/repo";
import { dayIndex } from "@/game/levels";
import type { Rules } from "@/game/rules";

export function rulesSummary(rules: Rules): string {
  const parts = [String(rules.start), `${rules.out} out`, `first to ${rules.firstTo}`];
  if (rules.finish === "places") parts.push("places");
  if (rules.randomOrder) parts.push("random order");
  return parts.join(" · ");
}

export function setupName(setup: Setup, players: Map<string, Player>): string {
  if (setup.name) return setup.name;
  const names = setup.playerIds.map((id) => players.get(id)?.name ?? "?");
  return names.length <= 3 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function relativeDay(at: number, now = Date.now()): string {
  const days = dayIndex(now) - dayIndex(at);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(at).toLocaleDateString(undefined, { weekday: "short" });
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function ordinal(n: number): string {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

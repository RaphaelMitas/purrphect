import type { Player, Setup } from "@/db/repo";
import type { Rules } from "@/game/rules";

export function rulesSummary(rules: Rules): string {
  const out = rules.out === "double" ? "double out" : rules.out === "master" ? "master out" : "straight out";
  const legs = `first to ${rules.firstTo}`;
  return [String(rules.start), out, legs, rules.finish === "places" ? "places" : null].filter(Boolean).join(" · ");
}

export function setupName(setup: Setup, players: Map<string, Player>): string {
  if (setup.name) return setup.name;
  const names = setup.playerIds.map((id) => players.get(id)?.name ?? "?");
  return names.length <= 3 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function relativeDay(at: number, now = Date.now()): string {
  const days = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(at).toLocaleDateString(undefined, { weekday: "short" });
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function ordinal(n: number): string {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

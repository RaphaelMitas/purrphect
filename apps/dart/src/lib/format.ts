import type { Player, Setup } from "@/db/repo";
import { dayIndex } from "@/game/levels";
import type { Rules } from "@/game/rules";
import type { Messages } from "@/i18n/en";

export function rulesSummary(t: Messages, rules: Rules): string {
  const parts = [String(rules.start), t.rules.out[rules.out], t.rules.firstTo(rules.firstTo)];
  if (rules.finish === "places") parts.push(t.rules.places);
  if (rules.randomOrder) parts.push(t.rules.randomOrder);
  return parts.join(" · ");
}

export function setupName(setup: Setup, players: Map<string, Player>): string {
  if (setup.name) return setup.name;
  const names = setup.playerIds.map((id) => players.get(id)?.name ?? "?");
  return names.length <= 3 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function relativeDay(t: Messages, at: number, now = Date.now()): string {
  const days = dayIndex(now) - dayIndex(at);
  if (days <= 0) return t.today;
  if (days === 1) return t.yesterday;
  if (days < 7) return new Date(at).toLocaleDateString(t.locale, { weekday: "short" });
  return new Date(at).toLocaleDateString(t.locale, { day: "numeric", month: "short" });
}

export function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function decimal(t: Messages, value: number): string {
  return value.toLocaleString(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

import { autoColors, MOODS, PRESETS, type Theme } from "@purrphect/ui/theme";
import { isRecord } from "@/db/parse";
import type { Messages } from "@/i18n/en";

export type Slot = "light" | "dark";

export interface ThemeState {
  slots: Record<Slot, string>;
  custom: Theme[];
}

export const DEFAULT_THEMES: ThemeState = { slots: { light: "purrphect", dark: "midnight" }, custom: [] };

export const ROLES = [
  { key: "page", auto: true },
  { key: "cards", auto: true },
  { key: "text", auto: true },
  { key: "accent", auto: false },
  { key: "second", auto: false },
  { key: "highlight", auto: false },
  { key: "danger", auto: false },
] as const;

export type RoleInfo = (typeof ROLES)[number];
type Role = RoleInfo["key"];

export const themeName = (theme: Theme, t: Messages) => theme.name.trim() || t.theme.untitled;

export const isAuto = (theme: Theme, role: Role) => theme[role] === undefined;

export function roleColor(theme: Theme, role: Role): string {
  if (role === "page" || role === "cards" || role === "text") return theme[role] ?? autoColors(theme)[role];
  return theme[role];
}

export const allThemes = (state: ThemeState): Theme[] => [...PRESETS, ...state.custom];

export const isCustom = (state: ThemeState, id: string) => state.custom.some((t) => t.id === id);

const themeById = (state: ThemeState, id: string) => allThemes(state).find((t) => t.id === id);

export function slotTheme(state: ThemeState, slot: Slot): Theme {
  const theme = themeById(state, state.slots[slot]) ?? themeById(DEFAULT_THEMES, DEFAULT_THEMES.slots[slot]);
  if (!theme) throw new Error(`No built-in theme for the ${slot} slot`);
  return theme;
}

const bySlot = (pick: (slot: Slot) => string): Record<Slot, string> => ({ light: pick("light"), dark: pick("dark") });

export const withSlot = (state: ThemeState, slot: Slot, id: string): ThemeState => ({
  ...state,
  slots: { ...state.slots, [slot]: id },
});

export const withTheme = (state: ThemeState, theme: Theme): ThemeState => ({
  ...state,
  custom: [...state.custom, theme],
});

export const withUpdatedTheme = (state: ThemeState, theme: Theme): ThemeState =>
  isCustom(state, theme.id) ? { ...state, custom: state.custom.map((t) => (t.id === theme.id ? theme : t)) } : state;

export const withoutTheme = (state: ThemeState, id: string): ThemeState => ({
  slots: bySlot((s) => (state.slots[s] === id ? DEFAULT_THEMES.slots[s] : state.slots[s])),
  custom: state.custom.filter((t) => t.id !== id),
});

const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
const optionalHex = (v: unknown) => (isHex(v) ? v : undefined);

function parseTheme(v: unknown): Theme | null {
  if (!isRecord(v)) return null;
  const mood = MOODS.find((m) => m === v.mood);
  const { id, name, accent, second, highlight, danger, warmth } = v;
  if (typeof id !== "string" || typeof name !== "string" || !mood) return null;
  if (!isHex(accent) || !isHex(second) || !isHex(highlight) || !isHex(danger)) return null;
  if (typeof warmth !== "number" || warmth < 0 || warmth > 100) return null;
  return {
    id,
    name,
    accent,
    second,
    highlight,
    danger,
    warmth,
    mood,
    page: optionalHex(v.page),
    cards: optionalHex(v.cards),
    text: optionalHex(v.text),
  };
}

export function parseThemeState(json: string | null): ThemeState {
  if (!json) return DEFAULT_THEMES;
  try {
    const v: unknown = JSON.parse(json);
    if (!isRecord(v) || !isRecord(v.slots) || !Array.isArray(v.custom)) return DEFAULT_THEMES;
    const { slots } = v;
    const custom = v.custom.map(parseTheme).filter((t): t is Theme => t !== null);
    const slot = (s: Slot) => {
      const id = slots[s];
      return typeof id === "string" ? id : DEFAULT_THEMES.slots[s];
    };
    return { slots: bySlot(slot), custom };
  } catch {
    return DEFAULT_THEMES;
  }
}

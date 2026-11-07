import {
  contrast,
  hexToRgb,
  hslToHex,
  MOODS,
  PRESETS,
  type Theme,
  type TokenSet,
  themeTokens,
  tripletToHex,
} from "@purrphect/ui/theme";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEMES,
  parseThemeState,
  slotTheme,
  withoutTheme,
  withSlot,
  withTheme,
  withUpdatedTheme,
} from "./themes";

const rgb = (tokens: TokenSet, name: keyof TokenSet) => hexToRgb(tripletToHex(tokens[name]));
const ratio = (tokens: TokenSet, a: keyof TokenSet, b: keyof TokenSet) => contrast(rgb(tokens, a), rgb(tokens, b));

describe("generated themes", () => {
  const variants = PRESETS.flatMap((preset) =>
    MOODS.flatMap((mood) => [0, 25, 50, 75, 100].map((warmth) => ({ ...preset, mood, warmth }))),
  );

  it("keep text, muted text and chip ink readable at every mood and warmth", () => {
    for (const theme of variants) {
      const tokens = themeTokens(theme);
      const where = `${theme.id} ${theme.mood} ${theme.warmth}`;
      expect(ratio(tokens, "foreground", "background"), where).toBeGreaterThanOrEqual(7);
      expect(ratio(tokens, "muted-foreground", "background"), where).toBeGreaterThanOrEqual(3);
      for (const tone of ["pink", "mint", "butter"] as const) {
        expect(ratio(tokens, `${tone}-ink`, `${tone}-soft`), `${where} ${tone}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("pick whichever auto text reads better on a hand-picked page, mid-greys included", () => {
    for (const preset of PRESETS) {
      for (let lightness = 0; lightness <= 100; lightness += 2) {
        const tokens = themeTokens({ ...preset, page: hslToHex(220, 10, lightness) });
        const where = `${preset.id} ${lightness}`;
        expect(ratio(tokens, "foreground", "background"), where).toBeGreaterThanOrEqual(3);
        expect(ratio(tokens, "foreground", "card"), where).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("theme state", () => {
  const mine: Theme = {
    id: "mine",
    name: "Mine",
    accent: "#FF70A0",
    second: "#5FCFAE",
    highlight: "#FFD36B",
    danger: "#E86F6F",
    warmth: 50,
    mood: "soft",
  };

  it("puts a slot back on its built-in when the theme in it is deleted", () => {
    const state = withSlot(withSlot(withTheme(DEFAULT_THEMES, mine), "light", "mine"), "dark", "mine");
    const after = withoutTheme(state, "mine");
    expect(after.slots).toEqual(DEFAULT_THEMES.slots);
    expect(after.custom).toEqual([]);
  });

  it("does not bring a deleted theme back when a stale editor saves it", () => {
    const deleted = withoutTheme(withTheme(DEFAULT_THEMES, mine), "mine");
    expect(withUpdatedTheme(deleted, { ...mine, name: "Renamed" })).toBe(deleted);
  });

  it("falls back to defaults for unreadable storage and drops invalid custom themes", () => {
    expect(parseThemeState("{not json")).toEqual(DEFAULT_THEMES);
    const stored = JSON.stringify({
      slots: { light: "mine", dark: 3 },
      custom: [mine, { ...mine, id: "bad", accent: "red" }],
    });
    const state = parseThemeState(stored);
    expect(state.slots).toEqual({ light: "mine", dark: "midnight" });
    expect(state.custom.map((t) => t.id)).toEqual(["mine"]);
  });

  it("shows a slot's built-in when its stored theme no longer exists", () => {
    expect(slotTheme(withSlot(DEFAULT_THEMES, "light", "gone"), "light").id).toBe("purrphect");
  });
});

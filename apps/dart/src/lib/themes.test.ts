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

const SURFACES = ["background", "card"] as const;
const TEXT_ON: [keyof TokenSet, readonly (keyof TokenSet)[], number][] = [
  ["foreground", [...SURFACES, "muted"], 7],
  ["muted-foreground", [...SURFACES, "muted"], 3],
  ...(["pink", "mint", "butter", "destructive"] as const).map(
    (tone): [keyof TokenSet, readonly (keyof TokenSet)[], number] => [`${tone}-ink`, [...SURFACES, `${tone}-soft`], 3],
  ),
];

describe("generated themes", () => {
  const variants = PRESETS.flatMap((preset) =>
    MOODS.flatMap((mood) => [0, 25, 50, 75, 100].map((warmth) => ({ ...preset, mood, warmth }))),
  );

  it("keep every text colour readable on every surface it sits on, at every mood and warmth", () => {
    for (const theme of variants) {
      const tokens = themeTokens(theme);
      for (const [text, surfaces, min] of TEXT_ON) {
        for (const surface of surfaces) {
          const where = `${theme.id} ${theme.mood} ${theme.warmth}: ${text} on ${surface}`;
          expect(ratio(tokens, text, surface), where).toBeGreaterThanOrEqual(min);
        }
      }
    }
  });

  it("keep a near-black danger colour readable as text on a black page", () => {
    for (const preset of PRESETS) {
      const tokens = themeTokens({ ...preset, mood: "black", danger: "#400000" });
      expect(ratio(tokens, "destructive-ink", "background"), preset.id).toBeGreaterThanOrEqual(3);
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
  const purrphect = PRESETS.find((t) => t.id === "purrphect");
  if (!purrphect) throw new Error("Purrphect preset missing");
  const mine: Theme = { ...purrphect, id: "mine", name: "Mine" };

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

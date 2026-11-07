export type Mood = "bright" | "soft" | "dim" | "dark" | "black";

export interface Theme {
  id: string;
  name: string;
  accent: string;
  second: string;
  highlight: string;
  danger: string;
  warmth: number;
  mood: Mood;
  page?: string;
  cards?: string;
  text?: string;
}

type ToneName = "pink" | "mint" | "butter" | "destructive";

type TokenName =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "border"
  | "input"
  | "ring"
  | ToneName
  | `${ToneName}-foreground`
  | `${ToneName}-soft`
  | `${ToneName}-ink`
  | "board-face"
  | "board-single"
  | "board-single-alt";

export type TokenSet = Record<TokenName, string>;

export declare const MOODS: readonly Mood[];
export declare const PRESETS: readonly Theme[];
export declare function themeTokens(theme: Theme): TokenSet;
export declare function isDark(tokens: TokenSet): boolean;
export declare function autoColors(theme: Theme): { page: string; cards: string; text: string };
export declare function tripletToHex(value: string): string;
export declare function hexToHsl(hex: string): [number, number, number];
export declare function hslToHex(h: number, s: number, l: number): string;
export declare function hexToRgb(hex: string): [number, number, number];
export declare function contrast(a: readonly number[], b: readonly number[]): number;

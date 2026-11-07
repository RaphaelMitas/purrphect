import { de } from "./de";
import { en, type Messages } from "./en";
import { fr } from "./fr";

export const MESSAGES = { en, de, fr } satisfies Record<string, Messages>;
export type Language = keyof typeof MESSAGES;
export type LanguagePreference = Language | "system";

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
] as const satisfies readonly { value: Language; label: string }[];

function isLanguage(code: string | null): code is Language {
  return LANGUAGE_OPTIONS.some((o) => o.value === code);
}

export function isLanguagePreference(value: string): value is LanguagePreference {
  return value === "system" || isLanguage(value);
}

export function resolveLanguage(
  preference: LanguagePreference,
  deviceLocales: readonly { languageCode: string | null }[],
): Language {
  if (preference !== "system") return preference;
  return deviceLocales.map((l) => l.languageCode).find(isLanguage) ?? "en";
}

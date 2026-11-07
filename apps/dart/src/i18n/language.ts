import { de } from "./de";
import { en } from "./en";
import { fr } from "./fr";

export const MESSAGES = { en, de, fr };
export type Language = keyof typeof MESSAGES;
export type LanguagePreference = Language | "system";
type DeviceLocale = { languageCode: string | null; languageTag: string };

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

export function localeTag(language: Language, deviceLocales: readonly DeviceLocale[]): string {
  return deviceLocales.find((l) => l.languageCode === language)?.languageTag ?? language;
}

export function resolveLanguage(
  preference: LanguagePreference,
  deviceLocales: readonly Pick<DeviceLocale, "languageCode">[],
): Language {
  if (preference !== "system") return preference;
  return deviceLocales.map((l) => l.languageCode).find(isLanguage) ?? "en";
}

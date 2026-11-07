import { useLocales } from "expo-localization";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from "react";
import { getLanguage, setLanguage } from "@/db/repo";
import { en, type Messages } from "./en";
import { type LanguagePreference, MESSAGES, resolveLanguage } from "./language";

interface LanguageState {
  t: Messages;
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const locales = useLocales();
  const [preference, setPreference] = useState<LanguagePreference | null>(null);

  useEffect(() => {
    getLanguage(db)
      .then(setPreference)
      .catch((error: unknown) => {
        console.error(error);
        setPreference("system");
      });
  }, [db]);

  const state = useMemo(
    () =>
      preference && {
        t: MESSAGES[resolveLanguage(preference, locales)],
        preference,
        setPreference: (next: LanguagePreference) => {
          setPreference(next);
          setLanguage(db, next).catch(console.error);
        },
      },
    [db, locales, preference],
  );

  if (!state) return null;
  return <LanguageContext value={state}>{children}</LanguageContext>;
}

export function useLanguage(): LanguageState {
  const state = use(LanguageContext);
  if (!state) throw new Error("useLanguage needs a LanguageProvider");
  return state;
}

// Components rendered outside the app shell, like in component tests, read English.
export function useT(): Messages {
  return use(LanguageContext)?.t ?? en;
}

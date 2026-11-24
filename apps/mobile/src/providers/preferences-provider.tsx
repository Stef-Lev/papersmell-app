import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import {
  darkColors,
  lightColors,
  type ThemeColors,
} from "../lib/theme";
import { getErrorMessage } from "../lib/translation";

export type Locale = "en" | "el";
export type ThemePreference = "system" | "light" | "dark";

type PreferencesContextValue = {
  locale: Locale;
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  colors: ThemeColors;
  preferencesError: string;
  setLocale: (locale: Locale) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [preferencesError, setPreferencesError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      SecureStore.getItemAsync("papersmell-locale"),
      SecureStore.getItemAsync("papersmell-theme"),
    ])
      .then(([savedLocale, savedTheme]) => {
        if (!active) return;
        if (savedLocale === "en" || savedLocale === "el") {
          setLocaleState(savedLocale);
        }
        if (
          savedTheme === "system" ||
          savedTheme === "light" ||
          savedTheme === "dark"
        ) {
          setThemeState(savedTheme);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setPreferencesError(
            getErrorMessage(cause, locale, "mobile.errors.loadPreferences"),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    await SecureStore.setItemAsync("papersmell-locale", nextLocale);
    setLocaleState(nextLocale);
    setPreferencesError("");
  }, []);

  const setTheme = useCallback(async (nextTheme: ThemePreference) => {
    await SecureStore.setItemAsync("papersmell-theme", nextTheme);
    setThemeState(nextTheme);
    setPreferencesError("");
  }, []);

  const resolvedTheme =
    theme === "system" ? (systemScheme === "dark" ? "dark" : "light") : theme;
  const colors = resolvedTheme === "dark" ? darkColors : lightColors;
  const value = useMemo(
    () => ({
      locale,
      theme,
      resolvedTheme,
      colors,
      preferencesError,
      setLocale,
      setTheme,
    }),
    [locale, theme, resolvedTheme, colors, preferencesError, setLocale, setTheme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }
  return context;
}

export type { ThemeColors };

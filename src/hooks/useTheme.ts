import { useEffect, useLayoutEffect, useState } from "react";
import {
  applyDocumentTheme,
  getEffectiveTheme,
  getInitialThemeMode,
  getNextThemeMode,
  getSystemTheme,
  persistThemeMode,
  SYSTEM_THEME_QUERY,
  updateThemeColorMeta,
} from "../theme";
import type { Theme, ThemeMode } from "../theme";

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const effectiveTheme = getEffectiveTheme(themeMode, systemTheme);
  const nextThemeMode = getNextThemeMode(themeMode);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia(SYSTEM_THEME_QUERY);
    const handleChange = () => setSystemTheme(query.matches ? "light" : "dark");

    handleChange();
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useLayoutEffect(() => {
    applyDocumentTheme(themeMode);
    updateThemeColorMeta(effectiveTheme);
    persistThemeMode(themeMode);
  }, [effectiveTheme, themeMode]);

  return {
    themeMode,
    effectiveTheme,
    nextThemeMode,
    setThemeMode,
  };
}

export type Theme = "light" | "dark";
export type ThemeMode = "system" | Theme;

export const THEME_STORAGE_KEY = "sleep-vis-theme";
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: light)";

export const THEME_META_COLORS: Record<Theme, string> = {
  light: "#f8fafc",
  dark: "#0f172a",
};

const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function getSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(SYSTEM_THEME_QUERY).matches
  ) {
    return "light";
  }

  return "dark";
}

export function getInitialThemeMode(): ThemeMode {
  try {
    const storedThemeMode = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(storedThemeMode)) return storedThemeMode;
  } catch {
    // Ignore storage access failures and fall back to the system setting.
  }

  return "system";
}

export function getEffectiveTheme(themeMode: ThemeMode, systemTheme: Theme): Theme {
  return themeMode === "system" ? systemTheme : themeMode;
}

export function getNextThemeMode(themeMode: ThemeMode): ThemeMode {
  if (themeMode === "system") return "light";
  if (themeMode === "light") return "dark";
  return "system";
}

export function getThemeModeLabel(themeMode: ThemeMode): string {
  return THEME_MODE_LABELS[themeMode];
}

export function applyDocumentTheme(themeMode: ThemeMode) {
  if (themeMode === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = themeMode;
  }
}

export function updateThemeColorMeta(theme: Theme) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.content = THEME_META_COLORS[theme];
    });
}

export function persistThemeMode(themeMode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch {
    // The theme still applies even when persistence is unavailable.
  }
}

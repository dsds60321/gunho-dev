export const AVAILABLE_THEMES = ["classic", "spring", "summer", "autumn", "winter", "rose", 'gh'] as const;

export type ThemeKey = (typeof AVAILABLE_THEMES)[number];

export const DEFAULT_THEME: ThemeKey = "gh";

export function normalizeTheme(value?: string | null): ThemeKey {
  if (!value) {
    return DEFAULT_THEME;
  }

  const found = AVAILABLE_THEMES.find((theme) => theme === value);
  return found ?? DEFAULT_THEME;
}

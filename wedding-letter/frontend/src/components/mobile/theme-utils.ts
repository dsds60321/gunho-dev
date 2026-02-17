import { CSSProperties } from "react";

export type ThemeParticle = {
  left: number;
  startTop: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  opacity: number;
  driftX: number;
  rotate: number;
  blur: number;
  background: string;
  radius: string;
};

export const THEME_DEFAULTS = {
  backgroundColor: "#fdf8f5",
  textColor: "#4a2c2a",
  accentColor: "#803b2a",
  pattern: "none",
  effectType: "none",
  fontFamily: "'Noto Sans KR', sans-serif",
  fontSize: 16,
  scrollReveal: false,
};

export function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

export function toRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex, "#000000");
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function clampThemeFontSize(value: number | undefined): number {
  if (!Number.isFinite(value)) return THEME_DEFAULTS.fontSize;
  return Math.min(28, Math.max(12, Math.round(value as number)));
}

export function buildThemePatternStyle(pattern: string, accentColor: string): CSSProperties {
  const strong = toRgba(accentColor, 0.12);
  const soft = toRgba(accentColor, 0.08);
  const subtle = toRgba(accentColor, 0.05);

  if (pattern === "dot") {
    return {
      backgroundImage: `radial-gradient(circle at 1px 1px, ${soft} 1px, transparent 0)`,
      backgroundSize: "16px 16px",
    };
  }

  if (pattern === "grid") {
    return {
      backgroundImage: `linear-gradient(${subtle} 1px, transparent 1px), linear-gradient(90deg, ${subtle} 1px, transparent 1px)`,
      backgroundSize: "22px 22px",
    };
  }

  if (pattern === "linen") {
    return {
      backgroundImage: `repeating-linear-gradient(45deg, ${subtle} 0 2px, transparent 2px 8px), repeating-linear-gradient(-45deg, ${subtle} 0 2px, transparent 2px 8px)`,
      backgroundSize: "18px 18px",
    };
  }

  if (pattern === "petal") {
    return {
      backgroundImage: `radial-gradient(circle at 20% 20%, ${soft} 0 12%, transparent 13%), radial-gradient(circle at 80% 80%, ${strong} 0 10%, transparent 11%)`,
      backgroundSize: "48px 48px",
    };
  }

  return {};
}

export function buildThemeParticles(effectType: string): ThemeParticle[] {
  if (effectType === "none") return [];

  const densityMap: Record<string, number> = {
    "cherry-blossom": 34,
    snow: 52,
    "falling-leaves": 28,
    "baby-breath": 56,
    forsythia: 32,
  };
  const count = densityMap[effectType] ?? 0;
  if (count <= 0) return [];

  const colorMap: Record<string, string[]> = {
    "cherry-blossom": ["#ffd6e5", "#ffc0d8", "#ffe7f0"],
    snow: ["#ffffff", "#eff7ff", "#f8fcff"],
    "falling-leaves": ["#d58f55", "#bf6f3a", "#cf9f6d"],
    "baby-breath": ["#ffffff", "#f4f8ff", "#eef6ff"],
    forsythia: ["#ffe55c", "#ffd733", "#f5c112"],
  };
  const colors = colorMap[effectType] ?? ["#ffffff"];

  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1;
    const baseSize = effectType === "baby-breath" ? 3 : effectType === "snow" ? 6 : 7;
    const width = baseSize + (seed % 5) * (effectType === "snow" ? 1.2 : 0.9);
    const height = effectType === "falling-leaves" || effectType === "forsythia" ? width * 1.6 : width;
    const radius =
      effectType === "cherry-blossom"
        ? "58% 42% 54% 46%"
        : effectType === "falling-leaves"
          ? "45% 55% 48% 52%"
          : effectType === "forsythia"
            ? "42% 58% 44% 56%"
            : "9999px";

    return {
      left: (seed * 17 + (seed % 7) * 9) % 100,
      startTop: -18 - (seed % 6) * 4,
      width,
      height,
      delay: -((seed % 14) * 0.7),
      duration: 11 + (seed % 8) * 1.2,
      opacity: effectType === "baby-breath" ? 0.55 + (seed % 3) * 0.12 : 0.45 + (seed % 4) * 0.1,
      driftX: -34 + (seed % 9) * 8,
      rotate: seed % 2 === 0 ? 320 : -320,
      blur: effectType === "baby-breath" ? 8 : effectType === "snow" ? 4 : 3,
      background: colors[seed % colors.length],
      radius,
    };
  });
}

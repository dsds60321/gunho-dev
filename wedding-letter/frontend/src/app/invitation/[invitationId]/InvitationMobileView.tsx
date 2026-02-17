"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { resolveAssetUrl } from "@/lib/assets";
import InvitationLocationMap from "./InvitationLocationMap";
import WeddingGallery from "@/components/WeddingGallery";
import MapShortcutButtons from "@/components/MapShortcutButtons";
import CopyTextButton from "@/components/CopyTextButton";
import GuestbookSection from "./GuestbookSection";
import RsvpEntryModal from "./RsvpEntryModal";

export type InvitationMobileViewData = {
  id: string;
  slug?: string;
  groomName: string;
  brideName: string;
  weddingDateTime: string;
  venueName: string;
  venueAddress: string;
  coverImageUrl?: string;
  mainImageUrl?: string;
  imageUrls: string[];
  messageLines: string[];
  message?: string;
  groomContact?: string;
  brideContact?: string;
  subway?: string;
  bus?: string;
  car?: string;
  fontFamily?: string;
  fontColor?: string;
  fontSize?: number;
  useSeparateAccounts: boolean;
  useGuestbook: boolean;
  useRsvpModal: boolean;
  accountNumber?: string;
  groomAccountNumber?: string;
  brideAccountNumber?: string;
  galleryTitle?: string;
  galleryType?: string;
  themeBackgroundColor?: string;
  themeTextColor?: string;
  themeAccentColor?: string;
  themePattern?: string;
  themeEffectType?: string;
  themeFontFamily?: string;
  themeFontSize?: number;
  themeScrollReveal?: boolean;
  heroDesignId?: string;
  heroEffectType?: string;
  heroEffectParticleCount?: number;
  heroEffectSpeed?: number;
  heroEffectOpacity?: number;
  messageFontFamily?: string;
  transportFontFamily?: string;
  rsvpTitle?: string;
  rsvpMessage?: string;
  rsvpButtonText?: string;
  rsvpFontFamily?: string;
  detailContent?: string;
  locationTitle?: string;
  locationFloorHall?: string;
  locationContact?: string;
  showMap?: boolean;
  lockMap?: boolean;
};

type HeroEffectOptions = {
  particleCount: number;
  speed: number;
  opacity: number;
};

type InvitationMobileViewProps = {
  invitation: InvitationMobileViewData;
  apiBaseUrl?: string;
  preview?: boolean;
  invitationIdForActions: string;
  slugForActions: string;
  embedded?: boolean;
};

const HERO_EFFECT_DEFAULTS: HeroEffectOptions = {
  particleCount: 30,
  speed: 100,
  opacity: 72,
};

const THEME_DEFAULTS = {
  backgroundColor: "#fdf8f5",
  textColor: "#4a2c2a",
  accentColor: "#803b2a",
  pattern: "none",
  effectType: "none",
  fontFamily: "'Noto Sans KR', sans-serif",
  fontSize: 16,
  scrollReveal: false,
};

type ThemeParticle = {
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

function clampHeroEffectValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeHeroEffectOptions(options?: Partial<HeroEffectOptions>): HeroEffectOptions {
  return {
    particleCount: clampHeroEffectValue(options?.particleCount ?? HERO_EFFECT_DEFAULTS.particleCount, 6, 120),
    speed: clampHeroEffectValue(options?.speed ?? HERO_EFFECT_DEFAULTS.speed, 40, 220),
    opacity: clampHeroEffectValue(options?.opacity ?? HERO_EFFECT_DEFAULTS.opacity, 15, 100),
  };
}

function buildSnowParticles(options: HeroEffectOptions) {
  const density = Math.max(24, Math.round(options.particleCount * 1.35));
  const speedRatio = clampHeroEffectValue(options.speed / 100, 0.4, 2.2);
  const opacityRatio = clampHeroEffectValue(options.opacity / 100, 0.15, 1);
  const glyphs = ["❄", "❅", "✻"];

  return Array.from({ length: density }, (_, idx) => {
    const left = (idx * 23 + (idx % 7) * 9) % 100;
    const baseSize = 6 + (idx % 6) * 1.2;
    const size = baseSize * (0.86 + opacityRatio * 0.45);
    return {
      left,
      delay: -((idx % 12) * 0.55),
      duration: (3.2 + (idx % 6) * 0.45) / speedRatio,
      size,
      opacity: clampHeroEffectValue((0.6 + (idx % 4) * 0.12) * opacityRatio, 0.45, 1),
      blur: 12 + (idx % 3) * 5,
      startTop: -30 - (idx % 5) * 8,
      driftX: -30 + (idx % 9) * 8,
      glyph: glyphs[idx % glyphs.length],
      rotate: idx % 2 === 0 ? 360 : -360,
    };
  });
}

function buildStarParticles(options: HeroEffectOptions) {
  const density = Math.max(10, Math.round(options.particleCount * 0.9));
  const speedRatio = clampHeroEffectValue(options.speed / 100, 0.4, 2.2);
  const opacityRatio = clampHeroEffectValue(options.opacity / 100, 0.15, 1);

  return Array.from({ length: density }, (_, idx) => ({
    top: (idx * 13 + (idx % 6) * 9) % 100,
    left: (idx * 17 + (idx % 5) * 11) % 100,
    delay: -((idx % 9) * 0.45),
    duration: (4.8 + (idx % 5) * 0.7) / speedRatio,
    size: 8 + (idx % 4) * 4,
    opacity: clampHeroEffectValue((0.36 + (idx % 4) * 0.16) * opacityRatio, 0.14, 1),
  }));
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

function toRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex, "#000000");
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clampThemeFontSize(value: number | undefined): number {
  if (!Number.isFinite(value)) return THEME_DEFAULTS.fontSize;
  return Math.min(28, Math.max(12, Math.round(value as number)));
}

function buildThemePatternStyle(pattern: string, accentColor: string): CSSProperties {
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

function buildThemeParticles(effectType: string): ThemeParticle[] {
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

function createTelHref(phone?: string) {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9+]/g, "");
  return digits ? `tel:${digits}` : "";
}

const SEOUL_TIME_ZONE = "Asia/Seoul";

type SeoulDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseSeoulDateParts(rawDate: string): SeoulDateParts | null {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(parsed);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? NaN);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? NaN);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? NaN);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? NaN);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? NaN);

  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;

  return { year, month, day, hour, minute };
}

function formatInvitationDate(dateTime: string) {
  const parts = parseSeoulDateParts(dateTime);
  if (!parts) {
    return {
      infoDate: "2026년 5월 23일 토요일 낮 12시 30분",
      year: "2026",
      yearShort: "26",
      month: "05",
      day: "23",
    };
  }

  const weekdayKo = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()];
  const year = String(parts.year);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const hour = parts.hour;
  const minute = String(parts.minute).padStart(2, "0");

  const ampmText = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return {
    infoDate: `${year}년 ${Number(month)}월 ${Number(day)}일 ${weekdayKo}요일 ${ampmText} ${hour12}시 ${minute}분`,
    year,
    yearShort: year.slice(-2),
    month,
    day: String(Number(day)),
  };
}

function buildCalendarInfo(rawDate: string) {
  if (!rawDate) {
    return { days: [] as Array<number | null>, weddingDay: 24, fullDateText: "2026.10.24", weekdayTimeText: "토요일 오후 12시 00분" };
  }

  const parts = parseSeoulDateParts(rawDate);
  if (!parts) {
    return { days: [] as Array<number | null>, weddingDay: 24, fullDateText: rawDate, weekdayTimeText: rawDate };
  }

  const year = parts.year;
  const month = parts.month - 1;
  const weddingDay = parts.day;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const days: Array<number | null> = [];
  for (let i = 0; i < firstDay; i += 1) days.push(null);
  for (let i = 1; i <= lastDate; i += 1) days.push(i);

  const formattedDateText = `${year}.${String(month + 1).padStart(2, "0")}.${String(weddingDay).padStart(2, "0")}`;
  const weekday = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][
    new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
  ];
  const ampm = parts.hour < 12 ? "오전" : "오후";
  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const weekdayTimeText = `${weekday} ${ampm} ${hour12}시 ${String(parts.minute).padStart(2, "0")}분`;

  return {
    days,
    weddingDay,
    fullDateText: formattedDateText,
    weekdayTimeText,
  };
}

function buildCountdownInfo(rawDate: string, nowMs: number) {
  if (!rawDate) return { days: "00", hours: "00", mins: "00", secs: "00", diffDaysText: "0" };
  const target = new Date(rawDate).getTime();
  const diff = target - nowMs;

  if (!Number.isFinite(target) || diff <= 0) return { days: "00", hours: "00", mins: "00", secs: "00", diffDaysText: "0" };

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days: String(d).padStart(2, "0"),
    hours: String(h).padStart(2, "0"),
    mins: String(m).padStart(2, "0"),
    secs: String(s).padStart(2, "0"),
    diffDaysText: String(d),
  };
}

export default function InvitationMobileView({
  invitation,
  apiBaseUrl,
  preview = false,
  invitationIdForActions,
  slugForActions,
  embedded = false,
}: InvitationMobileViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dateInfo = useMemo(() => formatInvitationDate(invitation.weddingDateTime), [invitation.weddingDateTime]);
  const calendarInfo = useMemo(() => buildCalendarInfo(invitation.weddingDateTime), [invitation.weddingDateTime]);
  const [countdownInfo, setCountdownInfo] = useState(() => ({ days: "00", hours: "00", mins: "00", secs: "00", diffDaysText: "0" }));
  const groomTel = useMemo(() => createTelHref(invitation.groomContact), [invitation.groomContact]);
  const brideTel = useMemo(() => createTelHref(invitation.brideContact), [invitation.brideContact]);
  const themeBackgroundColor = useMemo(
    () => normalizeHexColor(invitation.themeBackgroundColor, THEME_DEFAULTS.backgroundColor),
    [invitation.themeBackgroundColor],
  );
  const themeTextColor = useMemo(
    () => normalizeHexColor(invitation.themeTextColor, THEME_DEFAULTS.textColor),
    [invitation.themeTextColor],
  );
  const themeAccentColor = useMemo(
    () => normalizeHexColor(invitation.themeAccentColor, THEME_DEFAULTS.accentColor),
    [invitation.themeAccentColor],
  );
  const themePattern = invitation.themePattern ?? THEME_DEFAULTS.pattern;
  const themeEffectType = invitation.themeEffectType ?? THEME_DEFAULTS.effectType;
  const themeFontFamily = invitation.themeFontFamily ?? invitation.fontFamily ?? THEME_DEFAULTS.fontFamily;
  const themeFontSize = clampThemeFontSize(invitation.themeFontSize);
  const revealEnabled = invitation.themeScrollReveal ?? THEME_DEFAULTS.scrollReveal;
  const patternStyle = useMemo(() => buildThemePatternStyle(themePattern, themeAccentColor), [themePattern, themeAccentColor]);
  const themeParticles = useMemo(() => buildThemeParticles(themeEffectType), [themeEffectType]);
  const themeWrapperStyle = useMemo(
    () =>
      ({
        ...patternStyle,
        "--theme-bg": themeBackgroundColor,
        "--theme-text-primary": themeTextColor,
        "--theme-text-secondary": toRgba(themeTextColor, 0.72),
        "--theme-divider": toRgba(themeAccentColor, 0.22),
        "--theme-brand": themeAccentColor,
        "--theme-accent": toRgba(themeAccentColor, 0.88),
        "--invite-theme-text": themeTextColor,
        "--invite-surface": toRgba(themeBackgroundColor, 0.86),
        "--invite-surface-soft": toRgba(themeBackgroundColor, 0.72),
        backgroundColor: themeBackgroundColor,
        color: themeTextColor,
        fontFamily: themeFontFamily,
        fontSize: `${themeFontSize}px`,
      }) as CSSProperties,
    [patternStyle, themeBackgroundColor, themeTextColor, themeAccentColor, themeFontFamily, themeFontSize],
  );

  useEffect(() => {
    const updateCountdown = () => {
      setCountdownInfo(buildCountdownInfo(invitation.weddingDateTime, Date.now()));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [invitation.weddingDateTime]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-invite-reveal]"));
    if (targets.length === 0) return;

    if (!revealEnabled) {
      targets.forEach((target) => target.classList.add("invite-reveal-visible"));
      return;
    }

    targets.forEach((target) => target.classList.remove("invite-reveal-visible"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("invite-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        root: embedded ? root.parentElement : null,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [embedded, revealEnabled, invitation.id]);

  const accountRows = invitation.useSeparateAccounts
    ? [
        { label: "신랑측", value: invitation.groomAccountNumber },
        { label: "신부측", value: invitation.brideAccountNumber },
      ].filter((row): row is { label: string; value: string } => Boolean(row.value))
    : [{ label: "계좌", value: invitation.accountNumber }].filter((row): row is { label: string; value: string } => Boolean(row.value));

  const weddingTitle = `${invitation.groomName || "신랑"} & ${invitation.brideName || "신부"}`;
  const heroImageUrl = resolveAssetUrl(
    invitation.mainImageUrl || invitation.coverImageUrl || invitation.imageUrls?.[0] || "",
    apiBaseUrl,
  );

  const renderHeroOverlay = () => {
    const designId = invitation.heroDesignId ?? "simply-meant";
    if (designId === "none") return null;

    if (designId === "simply-meant") {
      return (
        <>
          <div className="absolute inset-0 bg-[#4f5568]/30" />
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="flex justify-between px-5 pt-6 text-[28px] text-white/75">
              <span className="serif-font text-sm tracking-[0.08em] font-semibold">SIMPLY</span>
              <span className="serif-font text-sm tracking-[0.08em] font-semibold">MEANT</span>
            </div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              <p className="serif-font text-[112px] leading-[0.82] font-bold text-white/95">
                {dateInfo.yearShort}
                <br />
                {dateInfo.month}
                <br />
                {`${dateInfo.day}`.padStart(2, "0")}
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-6 flex justify-between px-5 text-white/90">
              <span className="serif-font text-[30px] font-semibold tracking-[0.05em]">TO BE</span>
              <span className="serif-font text-[30px] font-semibold tracking-[0.05em]">TOGETHER</span>
            </div>
          </div>
        </>
      );
    }

    if (designId === "modern-center") {
      return (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center bg-black/10">
          <p className="text-sm tracking-[0.4em] font-light mb-4">
            {dateInfo.year} / {dateInfo.month} / {dateInfo.day}
          </p>
          <div className="w-8 h-px bg-white/50 my-6" />
          <p className="text-3xl font-bold tracking-widest">{weddingTitle}</p>
          <p className="mt-4 text-xs opacity-70 italic tracking-widest">We are getting married</p>
        </div>
      );
    }

    if (designId === "serif-classic") {
      return (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-white p-8">
          <div className="border border-white/30 p-8 w-full h-full flex flex-col items-center justify-center">
            <p className="serif-font text-6xl mb-6">
              {dateInfo.month}.{dateInfo.day}
            </p>
            <p className="text-base tracking-[0.3em] font-medium uppercase">{weddingTitle}</p>
            <div className="mt-10 text-[10px] tracking-[0.5em] opacity-60">INVITATION</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderHeroEffectLayer = (effectType?: string, inputOptions?: Partial<HeroEffectOptions>) => {
    const options = normalizeHeroEffectOptions(inputOptions);

    if (effectType === "wave") {
      const speedRatio = clampHeroEffectValue(options.speed / 100, 0.4, 2.2);
      const opacityRatio = clampHeroEffectValue(options.opacity / 100, 0.15, 1);
      const waveHeight = clampHeroEffectValue(36 + Math.round(options.particleCount * 0.48), 36, 85);
      return (
        <div className="hero-effect-layer">
          <div className="hero-wave-shell hero-wave-shell-top" style={{ height: `${waveHeight}px`, opacity: opacityRatio }}>
            <span className="hero-wave-curve hero-wave-curve-front" style={{ animationDuration: `${7 / speedRatio}s` }} />
            <span className="hero-wave-curve hero-wave-curve-back" style={{ animationDuration: `${10 / speedRatio}s`, animationDelay: "-1.8s" }} />
          </div>
          <div className="hero-wave-shell hero-wave-shell-bottom" style={{ height: `${waveHeight}px`, opacity: opacityRatio }}>
            <span className="hero-wave-curve hero-wave-curve-front" style={{ animationDuration: `${7 / speedRatio}s`, animationDelay: "-0.6s" }} />
            <span className="hero-wave-curve hero-wave-curve-back" style={{ animationDuration: `${10 / speedRatio}s`, animationDelay: "-2.2s" }} />
          </div>
        </div>
      );
    }

    if (effectType === "snow") {
      const particles = buildSnowParticles(options);
      return (
        <div className="hero-effect-layer hero-effect-layer-snow">
          {particles.map((particle, idx) => (
            <span
              key={`snow-${idx}`}
              className="hero-snowflake"
              style={{
                left: `${particle.left}%`,
                top: `${particle.startTop}%`,
                fontSize: `${particle.size}px`,
                lineHeight: 1,
                opacity: particle.opacity,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                textShadow: `0 0 ${particle.blur}px rgba(255,255,255,0.96), 0 0 ${particle.blur + 8}px rgba(188,220,255,0.75)`,
                ["--snow-drift-x" as string]: `${particle.driftX}px`,
                ["--snow-rotate" as string]: `${particle.rotate}deg`,
              }}
            >
              {particle.glyph}
            </span>
          ))}
        </div>
      );
    }

    if (effectType === "star") {
      const particles = buildStarParticles(options);
      return (
        <div className="hero-effect-layer">
          {particles.map((particle, idx) => (
            <span
              key={`star-${idx}`}
              className="hero-star"
              style={{
                top: `${particle.top}%`,
                left: `${particle.left}%`,
                fontSize: `${particle.size}px`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                opacity: particle.opacity,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      );
    }

    return null;
  };

  const content = (
    <div
      ref={rootRef}
      className={`invitation-theme-scope relative overflow-hidden ${revealEnabled ? "invite-reveal-enabled" : ""}`}
      style={themeWrapperStyle}
    >
      {themeParticles.length > 0 ? (
        <div className={`invite-theme-effect-layer invite-theme-effect-${themeEffectType}`}>
          {themeParticles.map((particle, index) => (
            <span
              key={`theme-particle-${themeEffectType}-${index}`}
              className="invite-theme-particle"
              style={{
                left: `${particle.left}%`,
                top: `${particle.startTop}%`,
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                opacity: particle.opacity,
                borderRadius: particle.radius,
                background: particle.background,
                filter: `blur(${particle.blur}px)`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                ["--invite-drift-x" as string]: `${particle.driftX}px`,
                ["--invite-rotate" as string]: `${particle.rotate}deg`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-[2]">
      <section className="relative overflow-hidden text-center" data-invite-reveal>
        {heroImageUrl ? <img className="h-[560px] w-full object-cover" src={heroImageUrl} alt="hero" /> : <div className="h-[560px] w-full bg-stone-100" />}
        {renderHeroEffectLayer(invitation.heroEffectType, {
          particleCount: invitation.heroEffectParticleCount,
          speed: invitation.heroEffectSpeed,
          opacity: invitation.heroEffectOpacity,
        })}
        {renderHeroOverlay()}
      </section>

      <div className="space-y-8 px-6 py-10">
        <section className="space-y-5 text-center" data-invite-reveal style={{ fontFamily: invitation.messageFontFamily }}>
          <p className="serif-font text-xs tracking-[0.33em] text-gray-400 uppercase">Invitation</p>
          <h3 className="serif-kr text-3xl font-semibold text-gray-800">소중한 분들을 초대합니다</h3>
          <div className="text-sm leading-8 text-theme-secondary ql-editor !p-0">
            {invitation.message ? (
              <div dangerouslySetInnerHTML={{ __html: invitation.message }} />
            ) : (
              invitation.messageLines.map((line, index) => <p key={`${invitation.id}-line-${index}`}>{line}</p>)
            )}
          </div>
          <p className="pt-2 text-sm font-medium text-gray-700">{weddingTitle}</p>
        </section>

        {invitation.detailContent ? (
          <section className="px-2" data-invite-reveal>
            <div className="text-sm leading-relaxed text-theme-secondary ql-editor !p-0" dangerouslySetInnerHTML={{ __html: invitation.detailContent }} />
          </section>
        ) : null}

        <section className="bg-white py-16 px-8 text-center" data-invite-reveal>
          <div className="mb-10 space-y-2">
            <p className="serif-font text-[22px] tracking-widest text-theme-brand">{calendarInfo.fullDateText}</p>
            <p className="text-[13px] text-theme-secondary font-light">{calendarInfo.weekdayTimeText}</p>
          </div>

          <div className="mx-auto max-w-[320px] pt-6 border-t border-warm/50">
            <div className="grid grid-cols-7 mb-6 text-[11px] font-medium text-theme-secondary">
              {["일", "월", "화", "수", "목", "금", "토"].map((weekday, index) => (
                <div key={weekday} className={index === 0 ? "text-theme-accent" : ""}>
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-[14px] font-light text-theme-primary gap-y-4">
              {calendarInfo.days.map((day, index) => {
                const isWeddingDay = day === calendarInfo.weddingDay;
                const isSunday = index % 7 === 0;
                if (day === null) return <div key={`empty-${index}`} />;
                return (
                  <div key={`day-${index}`} className="relative flex items-center justify-center h-9">
                    {isWeddingDay ? <span className="absolute h-9 w-9 rounded-full -z-0" style={{ backgroundColor: toRgba(themeAccentColor, 0.22) }} /> : null}
                    <span className={`relative z-10 ${isWeddingDay ? "font-bold" : isSunday ? "text-theme-accent" : ""}`} style={isWeddingDay ? { color: themeAccentColor } : undefined}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-warm/30 space-y-8">
            <div className="flex justify-center items-center gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] tracking-widest text-theme-secondary uppercase font-bold">Days</span>
                <span className="text-[24px] font-light tracking-widest text-theme-primary">{countdownInfo.days}</span>
              </div>
              <span className="text-xl font-light mb-1 text-theme-secondary opacity-60">:</span>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] tracking-widest text-theme-secondary uppercase font-bold">Hour</span>
                <span className="text-[24px] font-light tracking-widest text-theme-primary">{countdownInfo.hours}</span>
              </div>
              <span className="text-xl font-light mb-1 text-theme-secondary opacity-60">:</span>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] tracking-widest text-theme-secondary uppercase font-bold">Min</span>
                <span className="text-[24px] font-light tracking-widest text-theme-primary">{countdownInfo.mins}</span>
              </div>
              <span className="text-xl font-light mb-1 text-theme-secondary opacity-60">:</span>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] tracking-widest text-theme-secondary uppercase font-bold">Sec</span>
                <span className="text-[24px] font-light tracking-widest text-theme-primary">{countdownInfo.secs}</span>
              </div>
            </div>
            <p className="text-[13px] text-theme-secondary font-light">
              <span className="font-bold text-theme-primary">
                {invitation.groomName || "신랑"}, {invitation.brideName || "신부"}
              </span>
              의 결혼식이 <span className="text-theme-brand font-bold">{countdownInfo.diffDaysText}일</span> 남았습니다.
            </p>
          </div>
        </section>

        <section className="pb-16 px-6 text-center" data-invite-reveal>
          <div className="flex justify-center gap-4">
            {groomTel ? (
              <a className="rounded-full border border-warm bg-white px-8 py-3 text-[11px] font-bold text-theme-secondary hover:bg-theme transition-colors shadow-sm" href={groomTel}>
                신랑측 연락하기
              </a>
            ) : (
              <button className="rounded-full border border-warm bg-white/70 px-8 py-3 text-[11px] font-bold text-theme-secondary opacity-60 shadow-sm" type="button" disabled>
                신랑측 연락하기
              </button>
            )}
            {brideTel ? (
              <a className="rounded-full border border-warm bg-white px-8 py-3 text-[11px] font-bold text-theme-secondary hover:bg-theme transition-colors shadow-sm" href={brideTel}>
                신부측 연락하기
              </a>
            ) : (
              <button className="rounded-full border border-warm bg-white/70 px-8 py-3 text-[11px] font-bold text-theme-secondary opacity-60 shadow-sm" type="button" disabled>
                신부측 연락하기
              </button>
            )}
          </div>
        </section>

        {invitation.imageUrls.length > 0 ? (
          <section className="space-y-3" data-invite-reveal>
            <p className="text-center text-sm font-semibold">{invitation.galleryTitle || "웨딩 갤러리"}</p>
            <WeddingGallery images={invitation.imageUrls.map((url) => resolveAssetUrl(url, apiBaseUrl)).filter(Boolean)} mode={invitation.galleryType} />
          </section>
        ) : null}

        <section className="py-12 space-y-8" data-invite-reveal style={{ fontFamily: invitation.transportFontFamily }}>
          <div className="text-center space-y-2">
            <p className="serif-font text-xs tracking-widest text-theme-accent italic uppercase">Location</p>
            <h3 className="serif-kr text-xl font-semibold text-gray-800">{invitation.locationTitle}</h3>
          </div>

          {invitation.showMap !== false ? (
            <div className="relative w-full h-[280px] bg-stone-50 border-y border-warm">
              <InvitationLocationMap address={invitation.venueAddress} />
              {invitation.lockMap ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5">
                  <span className="material-symbols-outlined text-gray-400">lock</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="px-8 text-center space-y-2">
            <p className="text-base font-bold text-gray-800">{invitation.venueName}</p>
            {invitation.locationFloorHall ? <p className="text-sm text-theme-secondary">{invitation.locationFloorHall}</p> : null}
            <p className="text-sm text-theme-secondary">{invitation.venueAddress}</p>
            {invitation.locationContact ? <p className="text-xs text-theme-accent pt-1">{invitation.locationContact}</p> : null}
          </div>

          <MapShortcutButtons
            venueName={invitation.venueName}
            address={invitation.venueAddress}
            buttonClassName="flex-1 rounded-full border border-warm bg-white py-3 text-[11px] font-bold text-theme-secondary hover:bg-theme transition-colors"
          />

          <div className="px-8 space-y-6 pt-4">
            {invitation.subway ? (
              <div className="space-y-1 text-left">
                <p className="font-bold text-xs text-theme-brand">지하철</p>
                <div className="text-[13px] leading-relaxed text-theme-secondary ql-editor !p-0 !min-h-0" dangerouslySetInnerHTML={{ __html: invitation.subway }} />
              </div>
            ) : null}
            {invitation.bus ? (
              <div className="space-y-1 text-left">
                <p className="font-bold text-xs text-theme-brand">버스</p>
                <div className="text-[13px] leading-relaxed text-theme-secondary ql-editor !p-0 !min-h-0" dangerouslySetInnerHTML={{ __html: invitation.bus }} />
              </div>
            ) : null}
            {invitation.car ? (
              <div className="space-y-1 text-left">
                <p className="font-bold text-xs text-theme-brand">자가용</p>
                <div className="text-[13px] leading-relaxed text-theme-secondary ql-editor !p-0 !min-h-0" dangerouslySetInnerHTML={{ __html: invitation.car }} />
              </div>
            ) : null}
          </div>
        </section>

        {accountRows.length > 0 ? (
          <section className="py-12 space-y-10 bg-white" data-invite-reveal>
            <div className="space-y-2 text-center">
              <div className="serif-font text-sm tracking-widest text-theme-accent italic">Account</div>
              <h3 className="serif-kr text-xl">마음 전하실 곳</h3>
            </div>
            <div className="space-y-4">
              {accountRows.map((row) => (
                <div className="space-y-4 rounded-2xl border border-warm bg-theme p-6" key={`${invitation.id}-${row.label}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-widest font-bold text-theme-secondary uppercase">{row.label}</span>
                    <CopyTextButton text={row.value} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div data-invite-reveal>
          <GuestbookSection
            enabled={invitation.useGuestbook}
            invitationId={invitationIdForActions}
            slug={slugForActions}
            preview={preview}
            embedded={embedded}
          />
        </div>
      </div>

      <RsvpEntryModal
        enabled={invitation.useRsvpModal}
        invitationId={invitationIdForActions}
        slug={slugForActions}
        preview={preview}
        embedded={embedded}
        venueAddress={invitation.venueAddress}
        venueName={invitation.venueName}
        weddingDateText={dateInfo.infoDate}
        rsvpTitle={invitation.rsvpTitle}
        rsvpMessage={invitation.rsvpMessage}
        rsvpButtonText={invitation.rsvpButtonText}
        rsvpFontFamily={invitation.rsvpFontFamily}
      />
    </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="bg-theme">
      <div className="mobile-view">{content}</div>
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthMe, logout } from "@/lib/auth";
import { apiFetch, getApiErrorMessage, isApiError } from "@/lib/api";
import { resolveAssetUrl } from "@/lib/assets";
import InvitationMobileView from "@/app/invitation/[invitationId]/InvitationMobileView";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type KakaoLatLng = object;

type KakaoMap = {
  setCenter: (position: KakaoLatLng) => void;
  relayout: () => void;
};

type KakaoMarker = {
  setPosition: (position: KakaoLatLng) => void;
  setMap: (map: KakaoMap | null) => void;
};

type KakaoAddressResult = {
  x: string;
  y: string;
};

type KakaoGeocoder = {
  addressSearch: (address: string, callback: (result: KakaoAddressResult[], status: string) => void) => void;
};

type KakaoMapsApi = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (options: { map: KakaoMap; position: KakaoLatLng }) => KakaoMarker;
  services: {
    Geocoder: new () => KakaoGeocoder;
    Status: {
      OK: string;
    };
  };
};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMapsApi;
    };
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; buildingName: string }) => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void; embed: (element: HTMLElement) => void };
    };
  }
}

type EditorInvitation = {
  id: number;
  slug?: string | null;
  published: boolean;
  groomName?: string | null;
  brideName?: string | null;
  date?: string | null;
  locationName?: string | null;
  address?: string | null;
  message?: string | null;
  mainImageUrl?: string | null;
  imageUrls: string[];
  paperInvitationUrl?: string | null;
  groomContact?: string | null;
  brideContact?: string | null;
  accountNumber?: string | null;
  useSeparateAccounts: boolean;
  groomAccountNumber?: string | null;
  brideAccountNumber?: string | null;
  groomRelation?: string | null;
  groomFatherName?: string | null;
  groomFatherContact?: string | null;
  groomMotherName?: string | null;
  groomMotherContact?: string | null;
  brideRelation?: string | null;
  brideFatherName?: string | null;
  brideFatherContact?: string | null;
  brideMotherName?: string | null;
  brideMotherContact?: string | null;
  bus?: string | null;
  subway?: string | null;
  car?: string | null;
  fontFamily?: string | null;
  fontColor?: string | null;
  fontSize?: number | null;
  useGuestbook: boolean;
  useRsvpModal: boolean;
  backgroundMusicUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImageUrl?: string | null;
  galleryTitle?: string | null;
  galleryType?: string | null;
  themeBackgroundColor?: string | null;
  themeTextColor?: string | null;
  themeAccentColor?: string | null;
  themePattern?: string | null;
  themeEffectType?: string | null;
  themeFontFamily?: string | null;
  themeFontSize?: number | null;
  themeScrollReveal?: boolean | null;
  // 추가된 필드들
  heroDesignId?: string | null;
  heroEffectType?: string | null;
  heroEffectParticleCount?: number | null;
  heroEffectSpeed?: number | null;
  heroEffectOpacity?: number | null;
  messageFontFamily?: string | null;
  transportFontFamily?: string | null;
  rsvpTitle?: string | null;
  rsvpMessage?: string | null;
  rsvpButtonText?: string | null;
  rsvpFontFamily?: string | null;
  detailContent?: string | null;
  locationTitle?: string | null;
  locationFloorHall?: string | null;
  locationContact?: string | null;
  showMap?: boolean;
  lockMap?: boolean;
};

type PublishResponse = {
  invitationId: number;
  slug: string;
  shareUrl: string;
};

type GuestbookEntry = {
  id: number;
  name: string;
  content: string;
  createdAt: string;
};

type FormState = {
  groomName: string;
  brideName: string;
  date: string;
  locationName: string;
  address: string;
  message: string;
  slug: string;
  mainImageUrl: string;
  imageUrls: string[];
  paperInvitationUrl: string;
  groomContact: string;
  brideContact: string;
  accountNumber: string;
  useSeparateAccounts: boolean;
  groomAccountNumber: string;
  brideAccountNumber: string;
  groomRelation: string;
  groomFatherName: string;
  groomFatherContact: string;
  groomMotherName: string;
  groomMotherContact: string;
  brideRelation: string;
  brideFatherName: string;
  brideFatherContact: string;
  brideMotherName: string;
  brideMotherContact: string;
  bus: string;
  subway: string;
  car: string;
  fontFamily: string;
  fontColor: string;
  fontSize: string;
  useGuestbook: boolean;
  useRsvpModal: boolean;
  backgroundMusicUrl: string;
  accountBank: string;
  groomAccountBank: string;
  brideAccountBank: string;
  seoTitle: string;
  seoDescription: string;
  seoImageUrl: string;
  galleryTitle: string;
  galleryType: string;
  themeBackgroundColor: string;
  themeTextColor: string;
  themeAccentColor: string;
  themePattern: string;
  themeEffectType: string;
  themeFontFamily: string;
  themeFontSize: number;
  themeScrollReveal: boolean;
  // 추가된 필드들
  heroDesignId: string;
  heroEffectType: string;
  heroEffectParticleCount: number;
  heroEffectSpeed: number;
  heroEffectOpacity: number;
  messageFontFamily: string;
  transportFontFamily: string;
  rsvpTitle: string;
  rsvpMessage: string;
  rsvpButtonText: string;
  rsvpFontFamily: string;
  detailContent: string;
  // 추가된 오시는길 관련 필드
  locationTitle: string;
  locationFloorHall: string;
  locationContact: string;
  showMap: boolean;
  lockMap: boolean;
};

const defaultFormState: FormState = {
  groomName: "",
  brideName: "",
  date: "",
  locationName: "",
  address: "",
  message: "",
  slug: "",
  mainImageUrl: "",
  imageUrls: [],
  paperInvitationUrl: "",
  groomContact: "",
  brideContact: "",
  accountNumber: "",
  useSeparateAccounts: false,
  groomAccountNumber: "",
  brideAccountNumber: "",
  groomRelation: "아들",
  groomFatherName: "",
  groomFatherContact: "",
  groomMotherName: "",
  groomMotherContact: "",
  brideRelation: "딸",
  brideFatherName: "",
  brideFatherContact: "",
  brideMotherName: "",
  brideMotherContact: "",
  bus: "",
  subway: "",
  car: "",
  fontFamily: "'Noto Sans KR', sans-serif",
  fontColor: "#333333",
  fontSize: "16",
  useGuestbook: true,
  useRsvpModal: true,
  backgroundMusicUrl: "",
  accountBank: "",
  groomAccountBank: "",
  brideAccountBank: "",
  seoTitle: "",
  seoDescription: "",
  seoImageUrl: "",
  galleryTitle: "웨딩 갤러리",
  galleryType: "swipe",
  themeBackgroundColor: "#fdf8f5",
  themeTextColor: "#4a2c2a",
  themeAccentColor: "#803b2a",
  themePattern: "none",
  themeEffectType: "none",
  themeFontFamily: "'Noto Sans KR', sans-serif",
  themeFontSize: 16,
  themeScrollReveal: false,
  // 초기값
  heroDesignId: "simply-meant",
  heroEffectType: "none",
  heroEffectParticleCount: 30,
  heroEffectSpeed: 100,
  heroEffectOpacity: 72,
  messageFontFamily: "'Noto Sans KR', sans-serif",
  transportFontFamily: "'Noto Sans KR', sans-serif",
  rsvpTitle: "참석 의사 전달",
  rsvpMessage: "특별한 날 축하의 마음으로 참석해주시는 모든 분들을 위해\n참석 여부 전달을 부탁드립니다.",
  rsvpButtonText: "참석의사 전달하기",
  rsvpFontFamily: "'Noto Sans KR', sans-serif",
  detailContent: "",
  locationTitle: "오시는 길",
  locationFloorHall: "",
  locationContact: "",
  showMap: true,
  lockMap: false,
};

// Quill 설정
const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

// 리치 텍스트 에디터 컴포넌트 분리 (툴바 닫힘 버그 수정 및 입력 최적화)
const RichTextEditor = ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) => {
  const [localValue, setLocalValue] = useState(value || "");

  // 외부 value가 변경되면(초기 로드 등) 로컬 상태 동기화
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (val: string) => {
    setLocalValue(val);
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl border border-warm" 
      onPointerDown={(e) => e.stopPropagation()} 
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <ReactQuill 
        theme="snow" 
        value={localValue} 
        onChange={handleChange} 
        onBlur={handleBlur}
        modules={quillModules}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid var(--theme-divider) !important;
          padding: 8px 12px !important;
        }
        .ql-container.ql-snow {
          border: none !important;
          min-height: 120px;
        }
        .ql-picker-options {
          z-index: 1000 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
};

const HERO_DESIGNS = [
  { id: "none", name: "사용자 이미지 전용", description: "오버레이 없이 이미지만 표시합니다." },
  { id: "simply-meant", name: "Simply Meant", description: "상하단 텍스트와 중앙 대형 날짜 오버레이" },
  { id: "modern-center", name: "Modern Center", description: "중앙 정렬된 깔끔한 일시와 이름" },
  { id: "serif-classic", name: "Serif Classic", description: "세리프 폰트를 활용한 클래식한 감성" },
  { id: "minimal-top", name: "Minimal Top", description: "상단에 작게 표시되는 날짜와 이름" },
];

const HERO_EFFECTS = [
  { id: "none", name: "없음", description: "이펙트를 적용하지 않습니다." },
  { id: "wave", name: "물결", description: "이미지 상단과 하단에 물결 흐름을 추가합니다." },
  { id: "snow", name: "눈", description: "메인 이미지 위로 눈이 내리는 효과를 적용합니다." },
  { id: "star", name: "별", description: "메인 이미지 전체로 별이 흐르는 효과를 적용합니다." },
];

type HeroEffectOptions = {
  particleCount: number;
  speed: number;
  opacity: number;
};

const HERO_EFFECT_DEFAULTS: HeroEffectOptions = {
  particleCount: 30,
  speed: 100,
  opacity: 72,
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

const MP3_LIBRARY = [
  { name: "Romantic memories", url: "/mp3/romantic.mp3" },
  { name: "Love story", url: "/mp3/love-story.mp3" },
  { name: "Sweet wedding melody", url: "/mp3/sweet.mp3" },
  { name: "Beyond the time", url: "/mp3/beyond.mp3" },
];

const BANK_OPTIONS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "카카오뱅크",
  "토스뱅크",
  "기업은행",
  "SC제일은행",
  "우체국",
  "기타",
];

const THEME_PATTERN_OPTIONS = [
  { id: "none", name: "없음" },
  { id: "dot", name: "도트" },
  { id: "grid", name: "그리드" },
  { id: "linen", name: "린넨" },
  { id: "petal", name: "꽃잎 무늬" },
];

const THEME_EFFECT_OPTIONS = [
  { id: "none", name: "없음" },
  { id: "cherry-blossom", name: "벚꽃" },
  { id: "snow", name: "눈" },
  { id: "falling-leaves", name: "낙엽" },
  { id: "baby-breath", name: "안개꽃" },
  { id: "forsythia", name: "개나리" },
];

const THEME_FONT_OPTIONS = [
  { value: "'Noto Sans KR', sans-serif", label: "Noto Sans KR" },
  { value: "'Pretendard', 'Noto Sans KR', sans-serif", label: "Pretendard" },
  { value: "'Noto Serif KR', serif", label: "Noto Serif KR" },
];

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const KAKAO_MAPS_SCRIPT_SELECTOR = "script[data-kakao-maps-sdk='true']";
const MAX_CONTACT_LENGTH = 14;
const MAX_ACCOUNT_LENGTH = 14;
const MIN_THEME_FONT_SIZE = 12;
const MAX_THEME_FONT_SIZE = 28;

function sanitizeContactValue(value: string): string {
  return value.replace(/[^0-9-]/g, "").slice(0, MAX_CONTACT_LENGTH);
}

function sanitizeAccountValue(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, MAX_ACCOUNT_LENGTH);
}

function sanitizeColorValue(value: string, fallback: string): string {
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

function parseBankAndAccount(raw?: string | null): { bank: string; number: string } {
  const value = raw?.trim() ?? "";
  if (!value) {
    return { bank: "", number: "" };
  }

  const foundBank = BANK_OPTIONS.find((bank) => value.startsWith(bank));
  if (!foundBank) {
    return { bank: "기타", number: value };
  }

  const number = value.slice(foundBank.length).trim().replace(/^[-:| ]+/, "").trim();
  return { bank: foundBank, number };
}

function combineBankAndAccount(bank: string, account: string): string {
  const normalizedAccount = account.trim();
  if (!normalizedAccount) return "";
  const normalizedBank = bank.trim();
  if (!normalizedBank) return normalizedAccount;
  return `${normalizedBank} ${normalizedAccount}`;
}

function formatBytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function toDateTimeLocalValue(rawDate?: string | null): string {
  if (!rawDate) return "";

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate.slice(0, 16);
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  const hour = `${parsed.getHours()}`.padStart(2, "0");
  const minute = `${parsed.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatWeddingDate(rawDate: string): string {
  if (!rawDate) return "";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return rawDate;

  return parsed.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGuestbookDate(rawDate: string): string {
  if (!rawDate) return "";
  const normalized = rawDate.includes("T") ? rawDate : rawDate.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate.replace("T", " ").slice(0, 19);
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  const hour = `${parsed.getHours()}`.padStart(2, "0");
  const minute = `${parsed.getMinutes()}`.padStart(2, "0");
  const second = `${parsed.getSeconds()}`.padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
}

function buildFormStateFromInvitation(data: EditorInvitation): FormState {
  const mainAccount = parseBankAndAccount(data.accountNumber);
  const groomAccount = parseBankAndAccount(data.groomAccountNumber);
  const brideAccount = parseBankAndAccount(data.brideAccountNumber);

  // 백엔드 데이터에 새 필드가 없을 경우를 대비해 기본값 병합
  const typedData = data as any;

  return {
    groomName: data.groomName ?? "",
    brideName: data.brideName ?? "",
    date: toDateTimeLocalValue(data.date),
    locationName: data.locationName ?? "",
    address: data.address ?? "",
    message: data.message ?? "",
    slug: data.slug ?? "",
    mainImageUrl: data.mainImageUrl ?? "",
    imageUrls: data.imageUrls ?? [],
    paperInvitationUrl: data.paperInvitationUrl ?? "",
    groomContact: sanitizeContactValue(data.groomContact ?? ""),
    brideContact: sanitizeContactValue(data.brideContact ?? ""),
    accountNumber: sanitizeAccountValue(mainAccount.number),
    useSeparateAccounts: data.useSeparateAccounts ?? false,
    groomAccountNumber: sanitizeAccountValue(groomAccount.number),
    brideAccountNumber: sanitizeAccountValue(brideAccount.number),
    groomRelation: data.groomRelation ?? "아들",
    groomFatherName: data.groomFatherName ?? "",
    groomFatherContact: sanitizeContactValue(data.groomFatherContact ?? ""),
    groomMotherName: data.groomMotherName ?? "",
    groomMotherContact: sanitizeContactValue(data.groomMotherContact ?? ""),
    brideRelation: data.brideRelation ?? "딸",
    brideFatherName: data.brideFatherName ?? "",
    brideFatherContact: sanitizeContactValue(data.brideFatherContact ?? ""),
    brideMotherName: data.brideMotherName ?? "",
    brideMotherContact: sanitizeContactValue(data.brideMotherContact ?? ""),
    bus: data.bus ?? "",
    subway: data.subway ?? "",
    car: data.car ?? "",
    fontFamily: data.fontFamily ?? "'Noto Sans KR', sans-serif",
    fontColor: data.fontColor ?? "#333333",
    fontSize: String(data.fontSize ?? 16),
    useGuestbook: data.useGuestbook ?? true,
    useRsvpModal: data.useRsvpModal ?? true,
    backgroundMusicUrl: data.backgroundMusicUrl ?? "",
    accountBank: mainAccount.bank,
    groomAccountBank: groomAccount.bank,
    brideAccountBank: brideAccount.bank,
    seoTitle: data.seoTitle ?? "",
    seoDescription: data.seoDescription ?? "",
    seoImageUrl: data.seoImageUrl ?? "",
    galleryTitle: typedData.galleryTitle ?? defaultFormState.galleryTitle,
    galleryType: typedData.galleryType ?? defaultFormState.galleryType,
    themeBackgroundColor: sanitizeColorValue(
      typedData.themeBackgroundColor ?? defaultFormState.themeBackgroundColor,
      defaultFormState.themeBackgroundColor,
    ),
    themeTextColor: sanitizeColorValue(
      typedData.themeTextColor ?? data.fontColor ?? defaultFormState.themeTextColor,
      defaultFormState.themeTextColor,
    ),
    themeAccentColor: sanitizeColorValue(
      typedData.themeAccentColor ?? defaultFormState.themeAccentColor,
      defaultFormState.themeAccentColor,
    ),
    themePattern: typedData.themePattern ?? defaultFormState.themePattern,
    themeEffectType: typedData.themeEffectType ?? defaultFormState.themeEffectType,
    themeFontFamily: typedData.themeFontFamily ?? data.fontFamily ?? defaultFormState.themeFontFamily,
    themeFontSize: Math.round(
      clampHeroEffectValue(
      Number(typedData.themeFontSize ?? data.fontSize ?? defaultFormState.themeFontSize),
      MIN_THEME_FONT_SIZE,
      MAX_THEME_FONT_SIZE,
      ),
    ),
    themeScrollReveal: typedData.themeScrollReveal ?? defaultFormState.themeScrollReveal,
    // 새 필드 연동
    heroDesignId: typedData.heroDesignId ?? defaultFormState.heroDesignId,
    heroEffectType: typedData.heroEffectType === "shadow" ? "none" : (typedData.heroEffectType ?? defaultFormState.heroEffectType),
    heroEffectParticleCount: clampHeroEffectValue(
      Number(typedData.heroEffectParticleCount ?? defaultFormState.heroEffectParticleCount),
      6,
      120,
    ),
    heroEffectSpeed: clampHeroEffectValue(Number(typedData.heroEffectSpeed ?? defaultFormState.heroEffectSpeed), 40, 220),
    heroEffectOpacity: clampHeroEffectValue(
      Number(typedData.heroEffectOpacity ?? defaultFormState.heroEffectOpacity),
      15,
      100,
    ),
    messageFontFamily: typedData.messageFontFamily ?? defaultFormState.messageFontFamily,
    transportFontFamily: typedData.transportFontFamily ?? defaultFormState.transportFontFamily,
    rsvpTitle: typedData.rsvpTitle ?? defaultFormState.rsvpTitle,
    rsvpMessage: typedData.rsvpMessage ?? defaultFormState.rsvpMessage,
    rsvpButtonText: typedData.rsvpButtonText ?? defaultFormState.rsvpButtonText,
    rsvpFontFamily: typedData.rsvpFontFamily ?? defaultFormState.rsvpFontFamily,
    detailContent: typedData.detailContent ?? defaultFormState.detailContent,
    locationTitle: typedData.locationTitle ?? defaultFormState.locationTitle,
    locationFloorHall: typedData.locationFloorHall ?? defaultFormState.locationFloorHall,
    locationContact: sanitizeContactValue(typedData.locationContact ?? defaultFormState.locationContact),
    showMap: typedData.showMap ?? defaultFormState.showMap,
    lockMap: typedData.lockMap ?? defaultFormState.lockMap,
  };
}

export default function EditorPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<KakaoMap | null>(null);
  const kakaoMarkerRef = useRef<KakaoMarker | null>(null);
  const kakaoLoadPromiseRef = useRef<Promise<KakaoMapsApi> | null>(null);

  const [ready, setReady] = useState(false);
  const [loadingText, setLoadingText] = useState("편집기 초기화 중...");
  const [invitation, setInvitation] = useState<EditorInvitation | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugStatus, setSlugStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [kakaoJsKey, setKakaoJsKey] = useState("0944d526cb1b3611e14d9acb6ce6aa6a");
  const [mapReady, setMapReady] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
  const [isGuestbookModalOpen, setIsGuestbookModalOpen] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [selectedHeroDesign, setSelectedHeroDesign] = useState(defaultFormState.heroDesignId);
  const [selectedHeroEffect, setSelectedHeroEffect] = useState(defaultFormState.heroEffectType);
  const [selectedHeroEffectParticleCount, setSelectedHeroEffectParticleCount] = useState(defaultFormState.heroEffectParticleCount);
  const [selectedHeroEffectSpeed, setSelectedHeroEffectSpeed] = useState(defaultFormState.heroEffectSpeed);
  const [selectedHeroEffectOpacity, setSelectedHeroEffectOpacity] = useState(defaultFormState.heroEffectOpacity);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [guestbookLoading, setGuestbookLoading] = useState(false);
  const [guestbookSaving, setGuestbookSaving] = useState(false);
  const [guestbookForm, setGuestbookForm] = useState({ name: "", password: "", content: "" });
  const [mapMessage, setMapMessage] = useState("주소를 검색하거나 입력하면 미리보기에 지도가 반영됩니다.");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    hero: true,
    theme: false,
    location: true,
    transport: false,
    guestbook: false,
    rsvp: false,
    music: false,
    detail: false,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const weddingTitle = useMemo(() => {
    const groom = form.groomName.trim();
    const bride = form.brideName.trim();
    if (!groom && !bride) return "신랑 & 신부";
    return `${groom || "신랑"} & ${bride || "신부"}`;
  }, [form.groomName, form.brideName]);
  const heroDateDigits = useMemo(() => {
    if (!form.date) {
      return { yearShort: "26", month: "10", day: "24" };
    }
    const parsed = new Date(form.date);
    if (Number.isNaN(parsed.getTime())) {
      return { yearShort: "26", month: "10", day: "24" };
    }
    return {
      yearShort: String(parsed.getFullYear()).slice(-2),
      month: `${parsed.getMonth() + 1}`.padStart(2, "0"),
      day: `${parsed.getDate()}`.padStart(2, "0"),
    };
  }, [form.date]);

  const renderHeroOverlay = () => {
    if (form.heroDesignId === "none") return null;

    if (form.heroDesignId === "simply-meant") {
      return (
        <>
          <div className="absolute inset-0 bg-[#4f5568]/30" />
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="flex justify-between px-5 pt-6 text-white/80">
              <span className="serif-font text-xs tracking-[0.2em] font-semibold">SIMPLY</span>
              <span className="serif-font text-xs tracking-[0.2em] font-semibold">MEANT</span>
            </div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
              <p className="serif-font text-[88px] leading-[0.82] font-bold text-white/95">
                {heroDateDigits.yearShort}
                <br />
                {heroDateDigits.month}
                <br />
                {heroDateDigits.day}
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-6 flex justify-between px-5 text-white/90">
              <span className="serif-font text-[24px] font-semibold tracking-[0.05em]">TO BE</span>
              <span className="serif-font text-[24px] font-semibold tracking-[0.05em]">TOGETHER</span>
            </div>
          </div>
        </>
      );
    }

    if (form.heroDesignId === "modern-center") {
      return (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center bg-black/10">
          <p className="text-[13px] tracking-[0.4em] font-light mb-4">{form.date ? formatWeddingDate(form.date).split(" ").slice(0, 3).join(" / ") : "2026 / 10 / 24"}</p>
          <div className="w-8 h-px bg-white/50 my-6" />
          <p className="text-2xl font-bold tracking-widest">{weddingTitle}</p>
          <p className="mt-4 text-[11px] opacity-70 italic tracking-[0.2em]">We are getting married</p>
        </div>
      );
    }

    if (form.heroDesignId === "serif-classic") {
      return (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-white p-8">
          <div className="border border-white/30 p-8 w-full h-full flex flex-col items-center justify-center">
            <p className="serif-font text-5xl mb-6">{heroDateDigits.month}.{heroDateDigits.day}</p>
            <p className="text-sm tracking-[0.3em] font-medium uppercase">{weddingTitle}</p>
            <div className="mt-10 text-[10px] tracking-[0.5em] opacity-60">INVITATION</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderHeroEffectLayer = (effectType: string, inputOptions?: Partial<HeroEffectOptions>) => {
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

  const ensureKakaoMapsReady = useCallback(async (): Promise<KakaoMapsApi> => {
    if (typeof window === "undefined") {
      throw new Error("브라우저 환경이 아닙니다.");
    }

    const normalizedKey = kakaoJsKey.trim();
    if (!normalizedKey) {
      throw new Error("카카오 JavaScript 키가 비어 있습니다.");
    }

    if (window.kakao?.maps) {
      return new Promise<KakaoMapsApi>((resolve) => {
        window.kakao!.maps.load(() => resolve(window.kakao!.maps));
      });
    }

    if (!kakaoLoadPromiseRef.current) {
      kakaoLoadPromiseRef.current = new Promise<KakaoMapsApi>((resolve, reject) => {
        const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${normalizedKey}&libraries=services&autoload=false`;
        const waitForMaps = (remainingTries: number) => {
          if (window.kakao?.maps) {
            window.kakao.maps.load(() => resolve(window.kakao!.maps));
            return;
          }
          if (remainingTries <= 0) {
            reject(new Error("kakao.maps 객체가 생성되지 않았습니다."));
            return;
          }
          window.setTimeout(() => waitForMaps(remainingTries - 1), 100);
        };

        const staleScript = document.querySelector<HTMLScriptElement>(KAKAO_MAPS_SCRIPT_SELECTOR);
        if (staleScript && staleScript.src !== sdkUrl) {
          staleScript.remove();
        }

        const existingScript = document.querySelector<HTMLScriptElement>(KAKAO_MAPS_SCRIPT_SELECTOR);
        if (existingScript) {
          if (existingScript.getAttribute("data-loaded") === "true") {
            waitForMaps(50);
            return;
          }

          existingScript.addEventListener(
            "load",
            () => {
              existingScript.setAttribute("data-loaded", "true");
              waitForMaps(50);
            },
            { once: true },
          );
          existingScript.addEventListener("error", () => reject(new Error("카카오 지도 SDK 스크립트 로드 실패")), {
            once: true,
          });
          return;
        }

        const script = document.createElement("script");
        script.src = sdkUrl;
        script.async = true;
        script.setAttribute("data-kakao-maps-sdk", "true");
        script.onload = () => {
          script.setAttribute("data-loaded", "true");
          waitForMaps(50);
        };
        script.onerror = () => reject(new Error("카카오 지도 SDK 스크립트 로드 실패"));
        document.head.appendChild(script);
      }).catch((error) => {
        kakaoLoadPromiseRef.current = null;
        throw error;
      });
    }

    return kakaoLoadPromiseRef.current;
  }, [kakaoJsKey]);

  // 지도 인스턴스 초기화 및 관리
  useEffect(() => {
    if (mapReady && mapContainerRef.current && !kakaoMapRef.current) {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;
      
      const center = new kakao.maps.LatLng(37.566826, 126.9786567);
      kakaoMapRef.current = new kakao.maps.Map(mapContainerRef.current, {
        center,
        level: 3,
      });
    }
  }, [mapReady]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const me = await fetchAuthMe();
        if (!me.loggedIn) {
          router.replace("/login");
          return;
        }

        const invitationId = new URLSearchParams(window.location.search).get("id");
        let editorData: EditorInvitation;

        if (invitationId) {
          setLoadingText("기존 초대장 불러오는 중...");
          editorData = await apiFetch<EditorInvitation>(`/api/invitations/${invitationId}`);
        } else {
          setLoadingText("새 초대장 생성 중...");
          editorData = await apiFetch<EditorInvitation>("/api/invitations", {
            method: "POST",
            body: JSON.stringify({}),
          });
          router.replace(`/editor?id=${editorData.id}`);
        }

        setInvitation(editorData);
        setForm(buildFormStateFromInvitation(editorData));

        try {
          const payload = await apiFetch<{ kakaoJsKey?: string }>("/api/public/config", {
            method: "GET",
          });
          // 유효한 키가 내려올 때만 업데이트 (빈 값 방지)
          if (payload.kakaoJsKey && payload.kakaoJsKey.trim().length > 10) {
            setKakaoJsKey(payload.kakaoJsKey);
          }
        } catch {
          // 실패 시 mock-up에서 검증된 기본값 유지
        }
      } catch (error) {
        if (isApiError(error) && error.redirectedToLogin) {
          return;
        }
        router.replace("/");
        return;
      }

      setReady(true);
    };

    void initialize();
  }, [router]);

  useEffect(() => {
    if (!kakaoJsKey.trim()) return;

    let active = true;
    void ensureKakaoMapsReady()
      .then(() => {
        if (!active) return;
        setMapReady(true);
      })
      .catch(() => {
        if (!active) return;
        setMapReady(false);
        setMapMessage("지도 라이브러리를 불러오지 못했습니다. 카카오 JavaScript 키와 도메인 등록을 확인해 주세요.");
      });

    return () => {
      active = false;
    };
  }, [ensureKakaoMapsReady, kakaoJsKey]);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-daum-postcode='true']");
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.setAttribute("data-daum-postcode", "true");
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateContactField = (
    key:
      | "groomContact"
      | "brideContact"
      | "locationContact"
      | "groomFatherContact"
      | "groomMotherContact"
      | "brideFatherContact"
      | "brideMotherContact",
    value: string,
  ) => {
    updateField(key, sanitizeContactValue(value));
  };

  const updateAccountField = (key: "accountNumber" | "groomAccountNumber" | "brideAccountNumber", value: string) => {
    updateField(key, sanitizeAccountValue(value));
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const applyEditorData = (data: EditorInvitation) => {
    setInvitation(data);
    setForm(buildFormStateFromInvitation(data));
  };

  const loadGuestbookEntries = useCallback(async (invitationId: number) => {
    setGuestbookLoading(true);
    try {
      const entries = await apiFetch<GuestbookEntry[]>(`/api/invitations/${invitationId}/guestbook`);
      setGuestbookEntries(entries);
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      setToast({ message: "방명록 데이터를 불러오지 못했습니다.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setGuestbookLoading(false);
    }
  }, []);

  const handleGuestbookSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!invitation || guestbookSaving) return;

    const name = guestbookForm.name.trim();
    const password = guestbookForm.password.trim();
    const content = guestbookForm.content.trim();

    if (!name || !password || !content) {
      showToast("이름, 비밀번호, 내용을 모두 입력해 주세요.", "error");
      return;
    }

    setGuestbookSaving(true);
    try {
      const created = await apiFetch<GuestbookEntry>(`/api/invitations/${invitation.id}/guestbook`, {
        method: "POST",
        body: JSON.stringify({
          name,
          password,
          content,
        }),
      });
      setGuestbookEntries((prev) => [created, ...prev]);
      setGuestbookForm({ name: "", password: "", content: "" });
      setIsGuestbookModalOpen(false);
      showToast("방명록이 등록되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      showToast(getApiErrorMessage(error, "방명록 등록에 실패했습니다."), "error");
    } finally {
      setGuestbookSaving(false);
    }
  };

  useEffect(() => {
    if (!invitation?.id) {
      setGuestbookEntries([]);
      return;
    }
    void loadGuestbookEntries(invitation.id);
  }, [invitation?.id, loadGuestbookEntries]);

  const updateMap = useCallback(async (address: string) => {
    const mapContainer = mapContainerRef.current;

    if (!mapContainer) {
      setMapMessage("지도 영역을 준비 중입니다...");
      return;
    }

    if (!address.trim()) return;

    let maps: KakaoMapsApi;
    try {
      maps = await ensureKakaoMapsReady();
      setMapReady(true);
    } catch {
      setMapReady(false);
      setMapMessage("지도 라이브러리를 불러오지 못했습니다. 카카오 JavaScript 키와 도메인 등록을 확인해 주세요.");
      return;
    }

    const geocoder = new maps.services.Geocoder();
    
    geocoder.addressSearch(address, (result: KakaoAddressResult[], status: string) => {
      if (status !== maps.services.Status.OK || result.length === 0) {
        setMapMessage("주소를 찾지 못했습니다.");
        return;
      }

      const coords = new maps.LatLng(Number(result[0].y), Number(result[0].x));

      // [핵심] React 재렌더링으로 인해 깨진 지도를 복구하기 위해 컨테이너를 비우고 새로 생성
      mapContainer.innerHTML = "";
      
      const map = new maps.Map(mapContainer, {
        center: coords,
        level: 3
      });
      kakaoMapRef.current = map;

      const marker = new maps.Marker({
        map: map,
        position: coords
      });
      kakaoMarkerRef.current = marker;

      // 레이아웃 보정
      map.relayout();
      map.setCenter(coords);
      
      // 브라우저 렌더링 안착 후 재보정
      setTimeout(() => {
        map.relayout();
        map.setCenter(coords);
      }, 300);

      setMapMessage("지도가 성공적으로 반영되었습니다.");
    });
  }, [ensureKakaoMapsReady]);

  useEffect(() => {
    // ready(JSX 렌더링 완료)와 mapReady(스크립트 로드 완료)가 모두 충족되어야 함
    if (!ready || !mapReady || !form.address.trim()) return;
    
    const timer = setTimeout(() => {
      void updateMap(form.address);
    }, 600); // 렌더링 안착을 위해 시간을 조금 더 넉넉히 둠
    return () => clearTimeout(timer);
  }, [ready, mapReady, form.address, updateMap]);

  const execDaumPostcode = useCallback(() => {
    const container = document.getElementById("postcode-container");
    if (!container || !window.daum?.Postcode) return;

    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const addr = data.roadAddress || data.jibunAddress;
        const buildingName = data.buildingName;

        setForm((prev) => ({
          ...prev,
          address: addr,
          locationName: buildingName && prev.locationName.trim() === "" ? buildingName : prev.locationName,
        }));
        
        setIsPostcodeOpen(false);
        window.requestAnimationFrame(() => {
          setTimeout(() => void updateMap(addr), 200);
        });
      },
      width: "100%",
      height: "100%",
    }).embed(container);
  }, [updateMap]);

  useEffect(() => {
    if (isPostcodeOpen) {
      execDaumPostcode();
    }
  }, [isPostcodeOpen, execDaumPostcode]);

  const handleAssetUpload = async (
    payload: {
      mainImageFile?: File;
      paperInvitationFile?: File;
      seoImageFile?: File;
      backgroundMusicFile?: File;
      galleryFile?: File;
    },
  ) => {
    if (!invitation) return;

    const galleryFile = payload.galleryFile && payload.galleryFile.size > 0 ? payload.galleryFile : null;

    if (galleryFile) {
      if (galleryFile.size > MAX_IMAGE_UPLOAD_BYTES) {
        setSlugStatus(`이미지 용량 초과: ${galleryFile.name} (최대 ${formatBytesToMb(MAX_IMAGE_UPLOAD_BYTES)})`);
        return;
      }

      setUploading(true);
      setSlugStatus("갤러리 업로드 중 (1장)");

      try {
        const formData = new FormData();
        formData.append("galleryFiles", galleryFile);

        const updated = await apiFetch<EditorInvitation>(`/api/invitations/${invitation.id}/assets`, {
          method: "POST",
          body: formData,
        });
        applyEditorData(updated);
        showToast("이미지가 성공적으로 업로드되었습니다.");
      } catch (error) {
        if (isApiError(error) && error.redirectedToLogin) {
          return;
        }
        showToast("갤러리 업로드에 실패했습니다.", "error");
      } finally {
        setUploading(false);
      }

      return;
    }

    const formData = new FormData();
    if (payload.mainImageFile) formData.append("mainImageFile", payload.mainImageFile);
    if (payload.paperInvitationFile) formData.append("paperInvitationFile", payload.paperInvitationFile);
    if (payload.seoImageFile) formData.append("seoImageFile", payload.seoImageFile);
    if (payload.backgroundMusicFile) formData.append("backgroundMusicUrl", payload.backgroundMusicFile);

    if ([...formData.keys()].length === 0) return;

    setUploading(true);
    setSlugStatus("");

    try {
      const updated = await apiFetch<EditorInvitation>(`/api/invitations/${invitation.id}/assets`, {
        method: "POST",
        body: formData,
      });
      applyEditorData(updated);
      showToast("파일 업로드가 완료되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      showToast(getApiErrorMessage(error, "파일 업로드에 실패했습니다."), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!invitation) return;

    setSaving(true);
    setSlugStatus("");

    const parsedFontSize = Number(form.fontSize);

    try {
      const saved = await apiFetch<EditorInvitation>(`/api/invitations/${invitation.id}`, {
        method: "PUT",
        body: JSON.stringify({
          groomName: form.groomName,
          brideName: form.brideName,
          date: form.date,
          locationName: form.locationName,
          address: form.address,
          message: form.message,
          slug: form.slug,
          mainImageUrl: form.mainImageUrl,
          imageUrls: form.imageUrls,
          paperInvitationUrl: form.paperInvitationUrl,
          groomContact: sanitizeContactValue(form.groomContact),
          brideContact: sanitizeContactValue(form.brideContact),
          accountNumber: combineBankAndAccount(form.accountBank, sanitizeAccountValue(form.accountNumber)),
          useSeparateAccounts: form.useSeparateAccounts,
          groomAccountNumber: combineBankAndAccount(form.groomAccountBank, sanitizeAccountValue(form.groomAccountNumber)),
          brideAccountNumber: combineBankAndAccount(form.brideAccountBank, sanitizeAccountValue(form.brideAccountNumber)),
          groomRelation: form.groomRelation,
          groomFatherName: form.groomFatherName,
          groomFatherContact: sanitizeContactValue(form.groomFatherContact),
          groomMotherName: form.groomMotherName,
          groomMotherContact: sanitizeContactValue(form.groomMotherContact),
          brideRelation: form.brideRelation,
          brideFatherName: form.brideFatherName,
          brideFatherContact: sanitizeContactValue(form.brideFatherContact),
          brideMotherName: form.brideMotherName,
          brideMotherContact: sanitizeContactValue(form.brideMotherContact),
          bus: form.bus,
          subway: form.subway,
          car: form.car,
          fontFamily: form.fontFamily,
          fontColor: form.fontColor,
          fontSize: Number.isFinite(parsedFontSize) && parsedFontSize > 0 ? parsedFontSize : null,
          useGuestbook: form.useGuestbook,
          useRsvpModal: form.useRsvpModal,
          backgroundMusicUrl: form.backgroundMusicUrl,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          seoImageUrl: form.seoImageUrl,
          galleryTitle: form.galleryTitle,
          galleryType: form.galleryType,
          themeBackgroundColor: sanitizeColorValue(form.themeBackgroundColor, defaultFormState.themeBackgroundColor),
          themeTextColor: sanitizeColorValue(form.themeTextColor, defaultFormState.themeTextColor),
          themeAccentColor: sanitizeColorValue(form.themeAccentColor, defaultFormState.themeAccentColor),
          themePattern: form.themePattern,
          themeEffectType: form.themeEffectType,
          themeFontFamily: form.themeFontFamily,
          themeFontSize: Math.round(clampHeroEffectValue(form.themeFontSize, MIN_THEME_FONT_SIZE, MAX_THEME_FONT_SIZE)),
          themeScrollReveal: form.themeScrollReveal,
          // 추가 필드 저장
          heroDesignId: form.heroDesignId,
          heroEffectType: form.heroEffectType,
          heroEffectParticleCount: form.heroEffectParticleCount,
          heroEffectSpeed: form.heroEffectSpeed,
          heroEffectOpacity: form.heroEffectOpacity,
          messageFontFamily: form.messageFontFamily,
          transportFontFamily: form.transportFontFamily,
          rsvpTitle: form.rsvpTitle,
          rsvpMessage: form.rsvpMessage,
          rsvpButtonText: form.rsvpButtonText,
          rsvpFontFamily: form.rsvpFontFamily,
          detailContent: form.detailContent,
          // 추가 필드 저장
          locationTitle: form.locationTitle,
          locationFloorHall: form.locationFloorHall,
          locationContact: sanitizeContactValue(form.locationContact),
          showMap: form.showMap,
          lockMap: form.lockMap,
        }),
      });

      applyEditorData(saved);
      showToast("초대장 내용이 저장되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      const message = getApiErrorMessage(error, "저장 실패");
      showToast(message.includes("slug") ? "slug 중복 또는 형식 오류입니다." : "저장에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSlugCheck = async () => {
    if (!invitation) return;
    if (!form.slug.trim()) {
      setSlugStatus("slug를 입력해 주세요.");
      return;
    }

    try {
      const result = await apiFetch<{ slug: string; available: boolean }>(
        `/api/invitations/slug-check?slug=${encodeURIComponent(form.slug)}&invitationId=${invitation.id}`,
      );
      updateField("slug", result.slug);
      setSlugStatus(result.available ? "사용 가능한 slug 입니다." : "이미 사용 중인 slug 입니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      const message = getApiErrorMessage(error, "slug 형식이 올바르지 않습니다. (영문 소문자/숫자/-)");
      setSlugStatus(message);
    }
  };

  const handlePublish = async () => {
    if (!invitation) return;
    setPublishing(true);

    try {
      const result = await apiFetch<PublishResponse>(`/api/invitations/${invitation.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ slug: form.slug || null }),
      });

      setShareUrl(result.shareUrl);
      updateField("slug", result.slug);
      setInvitation((prev) => (prev ? { ...prev, slug: result.slug, published: true } : prev));
      showToast("청첩장이 성공적으로 발행되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      const message = getApiErrorMessage(error, "발행 실패");
      showToast(message.includes("slug") ? "발행 실패: slug를 확인해 주세요." : "발행 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!invitation) return;
    if (!window.confirm("이 청첩장을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.")) return;

    setDeleting(true);
    try {
      await apiFetch<{ message: string }>(`/api/invitations/${invitation.id}`, {
        method: "DELETE",
      });
      showToast("초대장이 삭제되었습니다.");
      router.push("/mypage");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) {
        return;
      }
      showToast("삭제 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (!ready || !invitation) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-theme-secondary">{loadingText}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-warm bg-white px-6 md:px-8">
        <div className="flex items-center gap-4">
          <button className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-900" type="button" onClick={() => router.push("/")}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-sm font-medium">Wedding Letter 에디터</span>
          </button>
          <div className="hidden h-4 w-px bg-[var(--theme-divider)] md:block" />
          <div className="hidden text-xs font-medium text-gray-400 md:block">초대장 ID: {invitation.id}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme"
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? "저장중..." : "저장하기"}
          </button>
          <button
            className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme"
            type="button"
            onClick={() => {
              router.push(`/invitation/${invitation.id}?preview=1`);
            }}
          >
            미리보기
          </button>
          <button
            className="rounded-full bg-theme-brand px-5 py-2 text-xs font-bold text-white"
            type="button"
            onClick={handlePublish}
            disabled={publishing || uploading || deleting}
          >
            {publishing ? "발행중..." : "발행하기"}
          </button>
          {!invitation.published ? (
            <button
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-500"
              type="button"
              onClick={handleDelete}
              disabled={saving || publishing || uploading || deleting}
            >
              {deleting ? "삭제중..." : "삭제하기"}
            </button>
          ) : null}
          <button
            className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary"
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <section className="sticky top-0 h-[calc(100vh-64px)] border-b border-warm bg-theme p-6 md:border-r md:border-b-0 md:p-8 flex items-center justify-center">
          <div className="relative w-full max-w-[420px] h-[760px] flex flex-col overflow-hidden rounded-[2.2rem] border border-warm bg-white shadow-2xl">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <InvitationMobileView
                embedded
                invitation={{
                  id: String(invitation.id),
                  slug: form.slug || String(invitation.id),
                  groomName: form.groomName || "신랑",
                  brideName: form.brideName || "신부",
                  weddingDateTime: form.date,
                  venueName: form.locationName || "예식장 정보 미입력",
                  venueAddress: form.address || "주소 정보 미입력",
                  coverImageUrl: form.mainImageUrl,
                  mainImageUrl: form.mainImageUrl,
                  imageUrls: form.imageUrls,
                  messageLines: form.message
                    .replace(/<[^>]+>/g, " ")
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                  message: form.message || "",
                  groomContact: form.groomContact,
                  brideContact: form.brideContact,
                  groomFatherName: form.groomFatherName,
                  groomFatherContact: form.groomFatherContact,
                  groomMotherName: form.groomMotherName,
                  groomMotherContact: form.groomMotherContact,
                  brideFatherName: form.brideFatherName,
                  brideFatherContact: form.brideFatherContact,
                  brideMotherName: form.brideMotherName,
                  brideMotherContact: form.brideMotherContact,
                  subway: form.subway,
                  bus: form.bus,
                  car: form.car,
                  useSeparateAccounts: form.useSeparateAccounts,
                  useGuestbook: form.useGuestbook,
                  useRsvpModal: form.useRsvpModal,
                  accountNumber: combineBankAndAccount(form.accountBank, form.accountNumber),
                  groomAccountNumber: combineBankAndAccount(form.groomAccountBank, form.groomAccountNumber),
                  brideAccountNumber: combineBankAndAccount(form.brideAccountBank, form.brideAccountNumber),
                  galleryTitle: form.galleryTitle,
                  galleryType: form.galleryType,
                  themeBackgroundColor: sanitizeColorValue(form.themeBackgroundColor, defaultFormState.themeBackgroundColor),
                  themeTextColor: sanitizeColorValue(form.themeTextColor, defaultFormState.themeTextColor),
                  themeAccentColor: sanitizeColorValue(form.themeAccentColor, defaultFormState.themeAccentColor),
                  themePattern: form.themePattern,
                  themeEffectType: form.themeEffectType,
                  themeFontFamily: form.themeFontFamily,
                  themeFontSize: Math.round(clampHeroEffectValue(form.themeFontSize, MIN_THEME_FONT_SIZE, MAX_THEME_FONT_SIZE)),
                  themeScrollReveal: form.themeScrollReveal,
                  heroDesignId: form.heroDesignId,
                  heroEffectType: form.heroEffectType,
                  heroEffectParticleCount: form.heroEffectParticleCount,
                  heroEffectSpeed: form.heroEffectSpeed,
                  heroEffectOpacity: form.heroEffectOpacity,
                  messageFontFamily: form.messageFontFamily,
                  transportFontFamily: form.transportFontFamily,
                  rsvpTitle: form.rsvpTitle,
                  rsvpMessage: form.rsvpMessage,
                  rsvpButtonText: form.rsvpButtonText,
                  rsvpFontFamily: form.rsvpFontFamily,
                  detailContent: form.detailContent,
                  locationTitle: form.locationTitle,
                  locationFloorHall: form.locationFloorHall,
                  locationContact: form.locationContact,
                  showMap: form.showMap,
                  lockMap: form.lockMap,
                }}
                preview
                invitationIdForActions={String(invitation.id)}
                slugForActions={form.slug || String(invitation.id)}
              />
            </div>
          </div>
        </section>

        <section className="custom-scrollbar overflow-y-auto bg-theme">
          <form className="mx-auto max-w-4xl px-0 py-0 md:px-0" onSubmit={handleSave}>
            <div className="px-6 py-10 md:px-10 space-y-2">
              <h1 className="serif-font text-3xl text-theme-brand">초대장 편집</h1>
              <p className="text-sm text-theme-secondary opacity-70">청첩장 내용을 항목별로 깔끔하게 관리하세요.</p>
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.theme ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.theme && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("theme")}
              >
                <span className="text-lg font-medium text-theme-brand">테마 설정 (전체 스타일)</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.theme ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.theme ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="rounded-2xl border border-warm bg-[#fdfcfb] p-6 space-y-5">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">색상</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">배경 색상</span>
                        <div className="flex gap-3">
                          <input
                            className="h-10 w-14 cursor-pointer rounded border border-warm overflow-hidden"
                            type="color"
                            value={form.themeBackgroundColor}
                            onChange={(e) => updateField("themeBackgroundColor", e.target.value)}
                          />
                          <input
                            className="input-premium flex-1"
                            value={form.themeBackgroundColor}
                            onChange={(e) => updateField("themeBackgroundColor", e.target.value)}
                          />
                        </div>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">기본 텍스트 색상</span>
                        <div className="flex gap-3">
                          <input
                            className="h-10 w-14 cursor-pointer rounded border border-warm overflow-hidden"
                            type="color"
                            value={form.themeTextColor}
                            onChange={(e) => updateField("themeTextColor", e.target.value)}
                          />
                          <input
                            className="input-premium flex-1"
                            value={form.themeTextColor}
                            onChange={(e) => updateField("themeTextColor", e.target.value)}
                          />
                        </div>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">강조 색상</span>
                        <div className="flex gap-3">
                          <input
                            className="h-10 w-14 cursor-pointer rounded border border-warm overflow-hidden"
                            type="color"
                            value={form.themeAccentColor}
                            onChange={(e) => updateField("themeAccentColor", e.target.value)}
                          />
                          <input
                            className="input-premium flex-1"
                            value={form.themeAccentColor}
                            onChange={(e) => updateField("themeAccentColor", e.target.value)}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-warm bg-[#fdfcfb] p-6 space-y-5">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">배경 패턴 / 이펙트</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">배경 패턴</span>
                        <select
                          className="input-premium"
                          value={form.themePattern}
                          onChange={(e) => updateField("themePattern", e.target.value)}
                        >
                          {THEME_PATTERN_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">전체 배경 이펙트</span>
                        <select
                          className="input-premium"
                          value={form.themeEffectType}
                          onChange={(e) => updateField("themeEffectType", e.target.value)}
                        >
                          {THEME_EFFECT_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className="text-[11px] text-theme-secondary">
                      전체 화면 이펙트: {THEME_EFFECT_OPTIONS.find((option) => option.id === form.themeEffectType)?.name ?? "없음"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-warm bg-[#fdfcfb] p-6 space-y-5">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">글꼴 / 스크롤 효과</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">전체 글꼴</span>
                        <select
                          className="input-premium"
                          value={form.themeFontFamily}
                          onChange={(e) => updateField("themeFontFamily", e.target.value)}
                        >
                          {THEME_FONT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">기본 글꼴 크기 (px)</span>
                        <input
                          className="input-premium"
                          type="number"
                          min={MIN_THEME_FONT_SIZE}
                          max={MAX_THEME_FONT_SIZE}
                          value={form.themeFontSize}
                          onChange={(e) =>
                            updateField(
                              "themeFontSize",
                              Math.round(clampHeroEffectValue(Number(e.target.value), MIN_THEME_FONT_SIZE, MAX_THEME_FONT_SIZE)),
                            )
                          }
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-warm bg-white px-4 py-3 text-sm text-theme-secondary">
                      <input
                        type="checkbox"
                        checked={form.themeScrollReveal}
                        onChange={(e) => updateField("themeScrollReveal", e.target.checked)}
                      />
                      스크롤 진입 시 스르륵 등장(리빌) 효과 사용
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
            <div className={`relative border-b border-warm transition-colors ${openSections.basic ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.basic && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("basic")}
              >
                <span className="text-lg font-medium text-theme-brand">기본 정보 (혼주 및 관계)</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.basic ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.basic ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-4 rounded-2xl border border-warm bg-[#fdfcfb] p-5">
                      <p className="text-xs font-bold tracking-wider text-theme-brand">신랑</p>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">이름</span>
                        <input className="input-premium" value={form.groomName} onChange={(e) => updateField("groomName", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">관계</span>
                        <input className="input-premium" value={form.groomRelation} onChange={(e) => updateField("groomRelation", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">연락처</span>
                        <input
                          className="input-premium"
                          value={form.groomContact}
                          onChange={(e) => updateContactField("groomContact", e.target.value)}
                          inputMode="numeric"
                          maxLength={MAX_CONTACT_LENGTH}
                          placeholder="숫자와 -만 입력 (최대 14자리)"
                        />
                      </label>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-warm bg-[#fdfcfb] p-5">
                      <p className="text-xs font-bold tracking-wider text-theme-brand">신부</p>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">이름</span>
                        <input className="input-premium" value={form.brideName} onChange={(e) => updateField("brideName", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">관계</span>
                        <input className="input-premium" value={form.brideRelation} onChange={(e) => updateField("brideRelation", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">연락처</span>
                        <input
                          className="input-premium"
                          value={form.brideContact}
                          onChange={(e) => updateContactField("brideContact", e.target.value)}
                          inputMode="numeric"
                          maxLength={MAX_CONTACT_LENGTH}
                          placeholder="숫자와 -만 입력 (최대 14자리)"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-warm bg-[#fdfcfb] p-5">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">혼주 정보</p>
                    <div className="grid grid-cols-[72px_1fr_1fr] gap-3 text-[11px] font-bold text-theme-secondary">
                      <span />
                      <span>신랑측</span>
                      <span>신부측</span>
                    </div>

                    <div className="grid grid-cols-[72px_1fr_1fr] gap-3 items-center">
                      <span className="text-xs font-bold text-theme-secondary">아버지</span>
                      <input className="input-premium" value={form.groomFatherName} onChange={(e) => updateField("groomFatherName", e.target.value)} />
                      <input className="input-premium" value={form.brideFatherName} onChange={(e) => updateField("brideFatherName", e.target.value)} />
                    </div>

                    <div className="grid grid-cols-[72px_1fr_1fr] gap-3 items-center">
                      <span className="text-xs font-bold text-theme-secondary">아버지 연락처</span>
                      <input
                        className="input-premium"
                        value={form.groomFatherContact}
                        onChange={(e) => updateContactField("groomFatherContact", e.target.value)}
                        inputMode="numeric"
                        maxLength={MAX_CONTACT_LENGTH}
                        placeholder="숫자와 -만 입력"
                      />
                      <input
                        className="input-premium"
                        value={form.brideFatherContact}
                        onChange={(e) => updateContactField("brideFatherContact", e.target.value)}
                        inputMode="numeric"
                        maxLength={MAX_CONTACT_LENGTH}
                        placeholder="숫자와 -만 입력"
                      />
                    </div>

                    <div className="grid grid-cols-[72px_1fr_1fr] gap-3 items-center">
                      <span className="text-xs font-bold text-theme-secondary">어머니</span>
                      <input className="input-premium" value={form.groomMotherName} onChange={(e) => updateField("groomMotherName", e.target.value)} />
                      <input className="input-premium" value={form.brideMotherName} onChange={(e) => updateField("brideMotherName", e.target.value)} />
                    </div>

                    <div className="grid grid-cols-[72px_1fr_1fr] gap-3 items-center">
                      <span className="text-xs font-bold text-theme-secondary">어머니 연락처</span>
                      <input
                        className="input-premium"
                        value={form.groomMotherContact}
                        onChange={(e) => updateContactField("groomMotherContact", e.target.value)}
                        inputMode="numeric"
                        maxLength={MAX_CONTACT_LENGTH}
                        placeholder="숫자와 -만 입력"
                      />
                      <input
                        className="input-premium"
                        value={form.brideMotherContact}
                        onChange={(e) => updateContactField("brideMotherContact", e.target.value)}
                        inputMode="numeric"
                        maxLength={MAX_CONTACT_LENGTH}
                        placeholder="숫자와 -만 입력"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className={`relative border-b border-warm transition-colors ${openSections.hero ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.hero && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("hero")}
              >
                <span className="text-lg font-medium text-theme-brand">메인 화면 & 예식 일시</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.hero ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.hero ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">예식 일시</span>
                    <input className="input-premium" type="datetime-local" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
                  </label>
                  
                  <div className="space-y-4 rounded-2xl border border-warm bg-[#fdfcfb] p-6">
                    <span className="text-xs font-bold text-theme-secondary">메인 이미지 및 디자인</span>
                    <div className="flex flex-col gap-4">
                      <div className="relative mx-auto aspect-[3/4] w-[30%] min-w-[120px] max-w-[180px] overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center group">
                        {form.mainImageUrl ? (
                          <>
                            <img className="h-full w-full object-cover" src={resolveAssetUrl(form.mainImageUrl)} alt="Main Preview" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold">이미지 변경</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">메인 이미지를 업로드해 주세요</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleAssetUpload({ mainImageFile: file });
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>
                      <button 
                        className="w-full rounded-xl bg-white border border-warm py-3 text-sm font-bold text-theme-brand shadow-sm hover:bg-theme transition-colors"
                        type="button"
                        onClick={() => setIsDesignModalOpen(true)}
                      >
                        디자인 선택
                      </button>
                      <button
                        className="w-full rounded-xl bg-white border border-warm py-3 text-sm font-bold text-theme-brand shadow-sm hover:bg-theme transition-colors"
                        type="button"
                        onClick={() => {
                          setSelectedHeroEffect(form.heroEffectType);
                          setSelectedHeroEffectParticleCount(form.heroEffectParticleCount);
                          setSelectedHeroEffectSpeed(form.heroEffectSpeed);
                          setSelectedHeroEffectOpacity(form.heroEffectOpacity);
                          setIsEffectModalOpen(true);
                        }}
                      >
                        이펙트 선택
                      </button>
                      <p className="text-[11px] text-theme-secondary">
                        선택된 이펙트: {HERO_EFFECTS.find((effect) => effect.id === form.heroEffectType)?.name ?? "없음"} / 입자 {form.heroEffectParticleCount} · 속도 {form.heroEffectSpeed}% · 투명도 {form.heroEffectOpacity}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">초대 메시지</span>
                    <div className="space-y-3">
                      <select
                        aria-label="초대 메시지 폰트"
                        className="input-premium text-xs"
                        value={form.messageFontFamily}
                        onChange={(e) => updateField("messageFontFamily", e.target.value)}
                      >
                        <option value="'Noto Sans KR', sans-serif">기본 폰트</option>
                        <option value="'serif-kr', serif">명조체 (Serif)</option>
                        <option value="'Pretendard', sans-serif">Pretendard</option>
                      </select>
                      <RichTextEditor
                        value={form.message}
                        onChange={(val) => updateField("message", val)}
                        placeholder="축하해주시는 분들께 전할 메시지를 입력해 주세요."
                      />
                    </div>
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">상세 내용 (추가 문구)</span>
                    <RichTextEditor 
                      value={form.detailContent} 
                      onChange={(val) => updateField("detailContent", val)} 
                      placeholder="청첩장 중간에 들어갈 상세 내용을 자유롭게 작성하세요."
                    />
                  </label>
                </div>
              ) : null}
            </div>
            <div className={`relative border-b border-warm transition-colors ${openSections.location ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.location && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("location")}
              >
                <span className="text-lg font-medium text-theme-brand">예식 장소</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.location ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.location ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">제목</span>
                      <input className="input-premium" value={form.locationTitle} onChange={(e) => updateField("locationTitle", e.target.value)} placeholder="예: 오시는 길" />
                    </label>
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">예식장 명</span>
                      <input className="input-premium" value={form.locationName} onChange={(e) => updateField("locationName", e.target.value)} placeholder="예: 시그니엘 서울" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">층과 홀</span>
                      <input className="input-premium" value={form.locationFloorHall} onChange={(e) => updateField("locationFloorHall", e.target.value)} placeholder="예: 76층 그랜드볼룸" />
                    </label>
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">연락처</span>
                      <input
                        className="input-premium"
                        value={form.locationContact}
                        onChange={(e) => updateContactField("locationContact", e.target.value)}
                        placeholder="숫자와 -만 입력 (최대 14자리)"
                        inputMode="numeric"
                        maxLength={MAX_CONTACT_LENGTH}
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">주소</span>
                    <div className="flex gap-2">
                      <input className="input-premium flex-1 bg-gray-50" value={form.address} readOnly placeholder="주소 검색 버튼을 눌러주세요." />
                      <button className="rounded-xl bg-theme-brand px-6 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity" type="button" onClick={() => setIsPostcodeOpen(true)}>
                        주소 검색
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${form.showMap ? 'bg-theme-brand' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.showMap ? 'translate-x-4' : ''}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={form.showMap} onChange={(e) => updateField("showMap", e.target.checked)} />
                      <span className="text-xs font-bold text-theme-secondary">지도 표시</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${form.lockMap ? 'bg-theme-brand' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.lockMap ? 'translate-x-4' : ''}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={form.lockMap} onChange={(e) => updateField("lockMap", e.target.checked)} />
                      <span className="text-xs font-bold text-theme-secondary">지도 잠금 (조작 비활성화)</span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.transport ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.transport && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("transport")}
              >
                <span className="text-lg font-medium text-theme-brand">교통 및 기타 (종이청첩장)</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.transport ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.transport ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="space-y-4">
                    <select 
                      className="input-premium text-xs" 
                      value={form.transportFontFamily} 
                      onChange={(e) => updateField("transportFontFamily", e.target.value)}
                    >
                      <option value="'Noto Sans KR', sans-serif">기본 폰트</option>
                      <option value="'serif-kr', serif">명조체 (Serif)</option>
                    </select>
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">지하철 안내</span>
                      <RichTextEditor value={form.subway} onChange={(val) => updateField("subway", val)} />
                    </label>
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">버스 안내</span>
                      <RichTextEditor value={form.bus} onChange={(val) => updateField("bus", val)} />
                    </label>
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">자가용 안내</span>
                      <RichTextEditor value={form.car} onChange={(val) => updateField("car", val)} />
                    </label>
                  </div>
                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">종이 청첩장 이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-theme-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-theme file:text-theme-brand hover:file:bg-theme-divider"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleAssetUpload({ paperInvitationFile: file });
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.guestbook ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.guestbook && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("guestbook")}
              >
                <span className="text-lg font-medium text-theme-brand">방명록 설정</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.guestbook ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.guestbook ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <label className="flex items-center gap-2 rounded-xl border border-warm bg-white px-4 py-3 text-sm text-theme-secondary">
                    <input type="checkbox" checked={form.useGuestbook} onChange={(e) => updateField("useGuestbook", e.target.checked)} /> 방명록 섹션 사용
                  </label>
                  <div className="rounded-2xl border border-warm bg-[#fdfcfb] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-theme-secondary">방명록 등록/미리보기</p>
                      <button
                        className="rounded-lg bg-theme-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                        type="button"
                        onClick={() => setIsGuestbookModalOpen(true)}
                      >
                        방명록 등록
                      </button>
                    </div>
                    {guestbookLoading ? <p className="text-xs text-theme-secondary">불러오는 중...</p> : null}
                    {!guestbookLoading && guestbookEntries.length === 0 ? (
                      <p className="text-xs text-theme-secondary">등록된 방명록이 없습니다.</p>
                    ) : null}
                    {!guestbookLoading && guestbookEntries.length > 0 ? (
                      <div className="space-y-2">
                        {guestbookEntries.slice(0, 5).map((entry) => (
                          <div className="rounded-xl border border-warm bg-white p-3" key={`setting-guestbook-${entry.id}`}>
                            <p className="text-xs font-bold text-theme-brand">{entry.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-theme-secondary">{entry.content}</p>
                            <p className="mt-1 text-[11px] text-gray-400">{formatGuestbookDate(entry.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.rsvp ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.rsvp && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("rsvp")}
              >
                <span className="text-lg font-medium text-theme-brand">RSVP 안내 팝업 설정</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.rsvp ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.rsvp ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <label className="flex items-center gap-2 mb-4 rounded-xl border border-warm bg-white px-4 py-3 text-sm text-theme-secondary">
                    <input type="checkbox" checked={form.useRsvpModal} onChange={(e) => updateField("useRsvpModal", e.target.checked)} /> RSVP 섹션 사용
                  </label>
                  
                  {form.useRsvpModal && (
                    <div className="space-y-4 rounded-2xl border border-warm bg-white p-6 shadow-sm">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">팝업 제목</span>
                        <input className="input-premium" value={form.rsvpTitle} onChange={(e) => updateField("rsvpTitle", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">팝업 안내 문구</span>
                        <textarea className="input-premium min-h-24" value={form.rsvpMessage} onChange={(e) => updateField("rsvpMessage", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">버튼 텍스트</span>
                        <input className="input-premium" value={form.rsvpButtonText} onChange={(e) => updateField("rsvpButtonText", e.target.value)} />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">팝업 폰트</span>
                        <select 
                          className="input-premium text-xs" 
                          value={form.rsvpFontFamily} 
                          onChange={(e) => updateField("rsvpFontFamily", e.target.value)}
                        >
                          <option value="'Noto Sans KR', sans-serif">기본 폰트</option>
                          <option value="'serif-kr', serif">명조체 (Serif)</option>
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.music ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.music && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("music")}
              >
                <span className="text-lg font-medium text-theme-brand">배경음악 설정</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.music ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.music ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-theme-secondary italic block mb-2">Music Library</span>
                    <div className="grid grid-cols-1 gap-2">
                      {MP3_LIBRARY.map((music) => (
                        <label 
                          key={music.url} 
                          className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer ${form.backgroundMusicUrl === music.url ? "border-theme-brand bg-theme/30" : "border-warm bg-white hover:bg-theme/10"}`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              className="accent-theme-brand"
                              checked={form.backgroundMusicUrl === music.url} 
                              onChange={() => updateField("backgroundMusicUrl", music.url)} 
                            />
                            <span className="text-sm font-medium text-theme-secondary">{music.name}</span>
                          </div>
                          <button 
                            type="button" 
                            className="text-theme-secondary hover:text-theme-brand"
                            onClick={(e) => {
                              e.preventDefault();
                              const audio = new Audio(music.url);
                              audio.play();
                              setTimeout(() => audio.pause(), 5000); // 5초 미리듣기
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                          </button>
                        </label>
                      ))}
                      <div className="relative mt-2">
                        <label className="flex items-center gap-2 p-4 rounded-xl border border-warm bg-white hover:bg-theme/10 cursor-pointer">
                          <input type="radio" className="accent-theme-brand" checked={!MP3_LIBRARY.some(m => m.url === form.backgroundMusicUrl) && form.backgroundMusicUrl !== ""} readOnly />
                          <span className="text-sm font-medium text-theme-secondary">직접 추가</span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleAssetUpload({ backgroundMusicFile: file });
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.detail ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.detail && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10"
                type="button"
                onClick={() => toggleSection("detail")}
              >
                <span className="text-lg font-medium text-theme-brand">상세 내용 (문구/계좌/갤러리)</span>
                <span
                  className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.detail ? "rotate-180" : ""}`}
                  style={{ fontVariationSettings: "'wght' 200" }}
                >
                  expand_more
                </span>
              </button>
              {openSections.detail ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="space-y-3 rounded-2xl border border-warm bg-[#fdfcfb] p-6">
                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">공유 URL slug</span>
                      <div className="flex gap-2">
                        <input className="input-premium flex-1" placeholder="예: gunho-sebin-wedding" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
                        <button className="rounded-xl bg-theme-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity" type="button" onClick={handleSlugCheck}>
                          중복확인
                        </button>
                      </div>
                    </label>
                    {slugStatus ? <p className="text-xs text-theme-secondary">{slugStatus}</p> : null}
                  </div>

                  <div className="space-y-4 rounded-2xl border border-warm bg-[#fdfcfb] p-6">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-theme-secondary">
                      <input type="checkbox" checked={form.useSeparateAccounts} onChange={(e) => updateField("useSeparateAccounts", e.target.checked)} />
                      신랑/신부 계좌 분리 사용
                    </label>

                    {!form.useSeparateAccounts ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr]">
                        <label className="space-y-2">
                          <span className="text-xs font-bold text-theme-secondary">은행</span>
                          <select className="input-premium" value={form.accountBank} onChange={(e) => updateField("accountBank", e.target.value)}>
                            <option value="">은행 선택</option>
                            {BANK_OPTIONS.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold text-theme-secondary">입금 계좌</span>
                          <input
                            className="input-premium"
                            value={form.accountNumber}
                            onChange={(e) => updateAccountField("accountNumber", e.target.value)}
                            inputMode="numeric"
                            maxLength={MAX_ACCOUNT_LENGTH}
                            placeholder="숫자만 입력 (최대 14자리)"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr]">
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-theme-secondary">신랑측 은행</span>
                            <select className="input-premium" value={form.groomAccountBank} onChange={(e) => updateField("groomAccountBank", e.target.value)}>
                              <option value="">은행 선택</option>
                              {BANK_OPTIONS.map((bank) => (
                                <option key={`groom-${bank}`} value={bank}>
                                  {bank}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-theme-secondary">신랑측 입금 계좌</span>
                            <input
                              className="input-premium"
                              value={form.groomAccountNumber}
                              onChange={(e) => updateAccountField("groomAccountNumber", e.target.value)}
                              inputMode="numeric"
                              maxLength={MAX_ACCOUNT_LENGTH}
                              placeholder="숫자만 입력 (최대 14자리)"
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr]">
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-theme-secondary">신부측 은행</span>
                            <select className="input-premium" value={form.brideAccountBank} onChange={(e) => updateField("brideAccountBank", e.target.value)}>
                              <option value="">은행 선택</option>
                              {BANK_OPTIONS.map((bank) => (
                                <option key={`bride-${bank}`} value={bank}>
                                  {bank}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-theme-secondary">신부측 입금 계좌</span>
                            <input
                              className="input-premium"
                              value={form.brideAccountNumber}
                              onChange={(e) => updateAccountField("brideAccountNumber", e.target.value)}
                              inputMode="numeric"
                              maxLength={MAX_ACCOUNT_LENGTH}
                              placeholder="숫자만 입력 (최대 14자리)"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-bold text-theme-secondary">폰트 종류</span>
                      <select className="input-premium" value={form.fontFamily} onChange={(e) => updateField("fontFamily", e.target.value)}>
                        <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                        <option value="'Pretendard', 'Noto Sans KR', sans-serif">Pretendard</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-theme-secondary">폰트 크기(px)</span>
                      <input className="input-premium" type="number" min={10} max={30} value={form.fontSize} onChange={(e) => updateField("fontSize", e.target.value)} />
                    </label>
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">폰트 컬러</span>
                    <div className="flex gap-4">
                      <input className="h-10 w-14 cursor-pointer rounded border border-warm overflow-hidden" type="color" value={form.fontColor} onChange={(e) => updateField("fontColor", e.target.value)} />
                      <input className="input-premium flex-1" value={form.fontColor} onChange={(e) => updateField("fontColor", e.target.value)} />
                    </div>
                  </label>

                  <label className="block space-y-2 text-sm">
                    <span className="text-xs font-bold text-theme-secondary">SEO 대표 이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-theme-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-theme file:text-theme-brand hover:file:bg-theme-divider"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleAssetUpload({ seoImageFile: file });
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">갤러리 제목</span>
                    <input className="input-premium" value={form.galleryTitle} onChange={(e) => updateField("galleryTitle", e.target.value)} />
                  </label>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">갤러리 타입</span>
                    <div className="flex gap-2">
                      {[
                        { id: "swipe", label: "스와이프" },
                        { id: "thumbnail-swipe", label: "썸네일 스와이프" },
                        { id: "grid", label: "그리드" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                            form.galleryType === item.id
                              ? "bg-theme-brand text-white"
                              : "border border-warm bg-white text-theme-secondary hover:bg-theme"
                          }`}
                          onClick={() => updateField("galleryType", item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block space-y-2 text-sm">
                    <span className="text-xs font-bold text-theme-secondary">갤러리 이미지 업로드 (1장씩 업로드)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-theme-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-theme file:text-theme-brand hover:file:bg-theme-divider"
                      onChange={(event) => {
                        const files = event.target.files;
                        if (files && files.length > 1) {
                          setSlugStatus("갤러리 이미지는 한 번에 1장씩만 업로드할 수 있습니다.");
                          event.currentTarget.value = "";
                          return;
                        }

                        const file = files?.[0];
                        if (file) {
                          void handleAssetUpload({ galleryFile: file });
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">SEO 제목</span>
                    <input className="input-premium" value={form.seoTitle} onChange={(e) => updateField("seoTitle", e.target.value)} />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">SEO 설명</span>
                    <textarea className="input-premium" value={form.seoDescription} onChange={(e) => updateField("seoDescription", e.target.value)} />
                  </label>

                  {uploading ? <p className="text-xs text-theme-secondary">파일 업로드 중...</p> : null}

                  {form.imageUrls.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {form.imageUrls.map((url, index) => (
                        <div className="relative group" key={`${url}-${index}`}>
                          <img className="aspect-square w-full rounded-lg object-cover border border-warm shadow-sm" src={resolveAssetUrl(url)} alt={`gallery-upload-${index + 1}`} />
                          <button
                            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            type="button"
                            onClick={() => updateField("imageUrls", form.imageUrls.filter((_, i) => i !== index))}
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="h-6" />
          </form>
        </section>
      </main>

      {/* 방명록 등록 모달 */}
      {isGuestbookModalOpen && (
        <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-warm px-8 py-5 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">방명록 등록</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-900 transition-colors"
                onClick={() => setIsGuestbookModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto bg-[#fdfcfb] px-8 py-6">
              <form className="space-y-4 rounded-2xl border border-warm bg-white p-5" onSubmit={handleGuestbookSubmit}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">이름</span>
                    <input
                      className="input-premium"
                      value={guestbookForm.name}
                      maxLength={30}
                      onChange={(event) => setGuestbookForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="작성자 이름"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">비밀번호</span>
                    <input
                      className="input-premium"
                      type="password"
                      value={guestbookForm.password}
                      maxLength={30}
                      onChange={(event) => setGuestbookForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="삭제/수정용 비밀번호"
                    />
                  </label>
                </div>
                <label className="space-y-2 block">
                  <span className="text-xs font-bold text-theme-secondary">내용</span>
                  <textarea
                    className="input-premium min-h-28"
                    value={guestbookForm.content}
                    maxLength={1000}
                    onChange={(event) => setGuestbookForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="축하 메시지를 남겨주세요."
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme"
                    onClick={() => setIsGuestbookModalOpen(false)}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-theme-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                    disabled={guestbookSaving}
                  >
                    {guestbookSaving ? "등록중..." : "등록하기"}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <p className="text-xs font-bold text-theme-secondary">등록된 방명록</p>
                {guestbookLoading ? <p className="text-xs text-theme-secondary">불러오는 중...</p> : null}
                {!guestbookLoading && guestbookEntries.length === 0 ? (
                  <div className="rounded-xl border border-warm bg-white p-4 text-xs text-theme-secondary">등록된 방명록이 없습니다.</div>
                ) : null}
                {!guestbookLoading && guestbookEntries.length > 0 ? (
                  <div className="space-y-2">
                    {guestbookEntries.map((entry) => (
                      <div className="rounded-xl border border-warm bg-white p-3" key={`modal-guestbook-${entry.id}`}>
                        <p className="text-xs font-bold text-theme-brand">
                          {entry.name}
                          <span className="ml-2 font-normal text-gray-400">{formatGuestbookDate(entry.createdAt)}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-theme-secondary">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 디자인 선택 모달 */}
      {isDesignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col">
            <header className="px-10 py-6 border-b border-warm flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-800">메인 화면 디자인 선택</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-900 transition-colors"
                onClick={() => {
                  setSelectedHeroDesign(form.heroDesignId);
                  setIsDesignModalOpen(false);
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfcfb]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {HERO_DESIGNS.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => setSelectedHeroDesign(design.id)}
                    className={`group relative flex flex-col gap-3 text-left transition-all ${selectedHeroDesign === design.id ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
                  >
                    <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-4 transition-all shadow-md ${selectedHeroDesign === design.id ? "border-theme-brand ring-4 ring-theme-brand/20" : "border-white hover:border-warm"}`}>
                      {/* 템플릿 미리보기 시뮬레이션 */}
                      <div className="absolute inset-0 bg-stone-100">
                        {form.mainImageUrl ? (
                          <img className="h-full w-full object-cover" src={resolveAssetUrl(form.mainImageUrl)} alt="Preview" />
                        ) : (
                          <div className="w-full h-full bg-stone-200 flex items-center justify-center text-[10px] text-gray-400">이미지 없음</div>
                        )}
                        <div className="absolute inset-0 bg-[#4f5568]/20" />
                        
                        {/* 디자인 오버레이 미리보기 */}
                        {design.id === "simply-meant" && (
                          <div className="absolute inset-0 p-3 flex flex-col justify-between text-[6px] text-white/80 pointer-events-none scale-[0.6]">
                            <div className="flex justify-between font-bold"><span>SIMPLY</span><span>MEANT</span></div>
                            <div className="text-center font-bold text-[30px] leading-none opacity-90">26<br/>10<br/>24</div>
                            <div className="flex justify-between font-bold"><span>TO BE</span><span>TOGETHER</span></div>
                          </div>
                        )}
                        {design.id === "modern-center" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center bg-black/10 scale-[0.7] pointer-events-none">
                            <p className="text-[6px] tracking-widest mb-2">2026 / 10 / 24</p>
                            <div className="w-4 h-px bg-white/50 my-2" />
                            <p className="text-[10px] font-bold">{weddingTitle}</p>
                          </div>
                        )}
                        {design.id === "serif-classic" && (
                          <div className="absolute inset-0 p-3 flex flex-col items-center justify-center text-white scale-[0.6] pointer-events-none">
                            <div className="border border-white/30 p-4 w-full h-full flex flex-col items-center justify-center">
                              <p className="serif-font text-2xl mb-2">10.24</p>
                              <p className="text-[8px] tracking-widest font-medium">{weddingTitle}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedHeroDesign === design.id && (
                        <div className="absolute top-3 right-3 z-20 bg-theme-brand text-white rounded-full p-1 shadow-lg">
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{design.name}</p>
                      <p className="text-[11px] text-theme-secondary opacity-70 leading-tight">{design.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <footer className="px-10 py-6 border-t border-warm bg-white flex gap-3 shrink-0">
              <button 
                type="button" 
                className="flex-1 rounded-2xl border border-warm py-4 text-sm font-bold text-theme-secondary hover:bg-theme transition-colors"
                onClick={() => {
                  setSelectedHeroDesign(form.heroDesignId);
                  setIsDesignModalOpen(false);
                }}
              >
                닫기
              </button>
              <button 
                type="button" 
                className="flex-[2] rounded-2xl bg-theme-brand py-4 text-sm font-bold text-white shadow-lg shadow-theme-brand/20 hover:opacity-90 transition-opacity"
                onClick={() => {
                  updateField("heroDesignId", selectedHeroDesign);
                  setIsDesignModalOpen(false);
                }}
              >
                적용하기
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* 이펙트 선택 모달 */}
      {isEffectModalOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col">
            <header className="px-10 py-6 border-b border-warm flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-800">메인 화면 이펙트 선택</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-900 transition-colors"
                onClick={() => {
                  setSelectedHeroEffect(form.heroEffectType);
                  setSelectedHeroEffectParticleCount(form.heroEffectParticleCount);
                  setSelectedHeroEffectSpeed(form.heroEffectSpeed);
                  setSelectedHeroEffectOpacity(form.heroEffectOpacity);
                  setIsEffectModalOpen(false);
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfcfb] space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {HERO_EFFECTS.map((effect) => (
                  <button
                    key={effect.id}
                    type="button"
                    onClick={() => setSelectedHeroEffect(effect.id)}
                    className={`group relative flex flex-col gap-3 text-left transition-all ${selectedHeroEffect === effect.id ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
                  >
                    <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-4 transition-all shadow-md ${selectedHeroEffect === effect.id ? "border-theme-brand ring-4 ring-theme-brand/20" : "border-white hover:border-warm"}`}>
                      <div className="absolute inset-0 bg-stone-100">
                        {form.mainImageUrl ? (
                          <img className="h-full w-full object-cover" src={resolveAssetUrl(form.mainImageUrl)} alt="Effect Preview" />
                        ) : (
                          <div className="w-full h-full bg-stone-200 flex items-center justify-center text-[10px] text-gray-400">이미지 없음</div>
                        )}
                        {renderHeroEffectLayer(effect.id, {
                          particleCount: selectedHeroEffectParticleCount,
                          speed: selectedHeroEffectSpeed,
                          opacity: selectedHeroEffectOpacity,
                        })}
                      </div>

                      {selectedHeroEffect === effect.id && (
                        <div className="absolute top-3 right-3 z-20 bg-theme-brand text-white rounded-full p-1 shadow-lg">
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{effect.name}</p>
                      <p className="text-[11px] text-theme-secondary opacity-70 leading-tight">{effect.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className={`rounded-2xl border border-warm bg-white p-6 space-y-5 ${selectedHeroEffect === "none" ? "opacity-50" : ""}`}>
                <p className="text-xs font-bold text-theme-secondary">이펙트 세부 설정</p>
                <label className="block space-y-2">
                  <div className="flex items-center justify-between text-xs text-theme-secondary">
                    <span className="font-bold">입자 수</span>
                    <span>{selectedHeroEffectParticleCount}</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={120}
                    step={1}
                    disabled={selectedHeroEffect === "none"}
                    value={selectedHeroEffectParticleCount}
                    onChange={(event) => setSelectedHeroEffectParticleCount(Number(event.target.value))}
                    className="w-full accent-[var(--theme-brand)]"
                  />
                </label>
                <label className="block space-y-2">
                  <div className="flex items-center justify-between text-xs text-theme-secondary">
                    <span className="font-bold">속도</span>
                    <span>{selectedHeroEffectSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={220}
                    step={1}
                    disabled={selectedHeroEffect === "none"}
                    value={selectedHeroEffectSpeed}
                    onChange={(event) => setSelectedHeroEffectSpeed(Number(event.target.value))}
                    className="w-full accent-[var(--theme-brand)]"
                  />
                </label>
                <label className="block space-y-2">
                  <div className="flex items-center justify-between text-xs text-theme-secondary">
                    <span className="font-bold">투명도</span>
                    <span>{selectedHeroEffectOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    step={1}
                    disabled={selectedHeroEffect === "none"}
                    value={selectedHeroEffectOpacity}
                    onChange={(event) => setSelectedHeroEffectOpacity(Number(event.target.value))}
                    className="w-full accent-[var(--theme-brand)]"
                  />
                </label>
              </div>
            </div>

            <footer className="px-10 py-6 border-t border-warm bg-white flex gap-3 shrink-0">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-warm py-4 text-sm font-bold text-theme-secondary hover:bg-theme transition-colors"
                onClick={() => {
                  setSelectedHeroEffect(form.heroEffectType);
                  setSelectedHeroEffectParticleCount(form.heroEffectParticleCount);
                  setSelectedHeroEffectSpeed(form.heroEffectSpeed);
                  setSelectedHeroEffectOpacity(form.heroEffectOpacity);
                  setIsEffectModalOpen(false);
                }}
              >
                닫기
              </button>
              <button
                type="button"
                className="flex-[2] rounded-2xl bg-theme-brand py-4 text-sm font-bold text-white shadow-lg shadow-theme-brand/20 hover:opacity-90 transition-opacity"
                onClick={() => {
                  updateField("heroEffectType", selectedHeroEffect);
                  updateField("heroEffectParticleCount", selectedHeroEffectParticleCount);
                  updateField("heroEffectSpeed", selectedHeroEffectSpeed);
                  updateField("heroEffectOpacity", selectedHeroEffectOpacity);
                  setIsEffectModalOpen(false);
                }}
              >
                적용하기
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* 주소 검색 모달 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[500px] h-[600px] overflow-hidden rounded-[2rem] bg-white shadow-2xl flex flex-col">
            <header className="px-8 py-5 border-b border-warm flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-800">주소 검색</h3>
              <button type="button" className="text-gray-400 hover:text-gray-900 transition-colors" onClick={() => setIsPostcodeOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div id="postcode-container" className="flex-1 w-full h-full" />
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 ${toast.type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"}`}>
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

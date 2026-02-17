"use client";

import { useCallback, useMemo } from "react";

type MapShortcutButtonsProps = {
  venueName?: string;
  address?: string;
  className?: string;
  buttonClassName?: string;
};

type MapShortcutOption = {
  id: "naver" | "kakao" | "tmap";
  label: string;
  appUrl: string;
  webUrl: string;
};

const DEFAULT_WRAPPER_CLASS = "flex justify-center gap-3 px-8";
const DEFAULT_BUTTON_CLASS =
  "flex-1 rounded-full border border-warm py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition-colors";
const APP_NAME = "wedding-letter";

function buildMapShortcutOptions(query: string): MapShortcutOption[] {
  const encodedQuery = encodeURIComponent(query);
  const encodedAppName = encodeURIComponent(APP_NAME);

  return [
    {
      id: "naver",
      label: "네이버 지도",
      appUrl: `nmap://search?query=${encodedQuery}&appname=${encodedAppName}`,
      webUrl: `https://map.naver.com/v5/search/${encodedQuery}`,
    },
    {
      id: "kakao",
      label: "카카오맵",
      appUrl: `kakaomap://search?q=${encodedQuery}`,
      webUrl: `https://map.kakao.com/?q=${encodedQuery}`,
    },
    {
      id: "tmap",
      label: "티맵",
      appUrl: `tmap://search?name=${encodedQuery}`,
      webUrl: "https://www.tmap.co.kr/",
    },
  ];
}

export default function MapShortcutButtons({
  venueName,
  address,
  className = DEFAULT_WRAPPER_CLASS,
  buttonClassName = DEFAULT_BUTTON_CLASS,
}: MapShortcutButtonsProps) {
  const destination = useMemo(() => [venueName, address].filter(Boolean).join(" ").trim(), [venueName, address]);
  const options = useMemo(() => buildMapShortcutOptions(destination), [destination]);
  const disabled = destination.length === 0;

  const openMapApp = useCallback((appUrl: string, webUrl: string) => {
    if (typeof window === "undefined") return;

    let fallbackTimer = 0;

    const clearFallback = () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("pagehide", clearFallback);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearFallback();
      }
    };

    window.addEventListener("pagehide", clearFallback);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    fallbackTimer = window.setTimeout(() => {
      clearFallback();
      window.location.href = webUrl;
    }, 800);

    window.location.href = appUrl;
  }, []);

  return (
    <div className={className}>
      {options.map((option) => (
        <button
          className={`${buttonClassName}${disabled ? " cursor-not-allowed opacity-50 hover:bg-transparent" : ""}`}
          key={option.id}
          type="button"
          onClick={() => {
            if (disabled) return;
            openMapApp(option.appUrl, option.webUrl);
          }}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
